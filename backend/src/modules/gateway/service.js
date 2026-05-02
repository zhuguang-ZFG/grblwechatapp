const { JOB, assertTransition } = require("../../shared/constants/statuses");

function now() {
  return new Date().toISOString();
}

function createGatewayService(app) {
  const db = app.db;
  const dispatchLeaseMs = Number(app.env.gatewayDispatchLeaseMs || 15000);
  const heartbeatStaleMs = Number(app.env.gatewayHeartbeatStaleMs || 60000);
  let staleTickSeq = 0;

  // In-memory device sessions
  const sessions = new Map();
  const pendingJobs = new Map(); // deviceId -> [jobId, ...]
  const inFlightJobs = new Map(); // deviceId -> { jobId, leaseExpiresAt }

  function verifyDeviceAuth(deviceId, deviceToken) {
    if (!deviceId || !deviceToken) {
      return false;
    }
    const device = db.prepare("SELECT id FROM devices WHERE id = ? AND device_token = ?").get(deviceId, deviceToken);
    return Boolean(device);
  }

  function getPendingQueue(deviceId) {
    if (!pendingJobs.has(deviceId)) {
      pendingJobs.set(deviceId, []);
    }
    return pendingJobs.get(deviceId);
  }

  function getPendingJobPayload(jobId) {
    const gen = db.prepare(`
      SELECT generations.gcode_asset_path FROM generations
      INNER JOIN jobs ON jobs.generation_id = generations.id
      WHERE jobs.id = ?
    `).get(jobId);
    return gen ? { jobId, gcodeAssetPath: gen.gcode_asset_path } : null;
  }

  function releaseExpiredLease(deviceId, options = {}) {
    const lease = inFlightJobs.get(deviceId);
    if (!lease) {
      return;
    }
    if (lease.leaseExpiresAt > Date.now()) {
      return;
    }
    inFlightJobs.delete(deviceId);
    const jobRow = db.prepare("SELECT trace_id FROM jobs WHERE id = ?").get(lease.jobId);
    app.logEvent("gateway_dispatch_lease_expired", {
      requestId: options.requestId || "",
      tickId: options.tickId || "",
      traceId: jobRow && jobRow.trace_id ? jobRow.trace_id : "",
      deviceId,
      jobId: lease.jobId,
      leaseExpiresAt: new Date(lease.leaseExpiresAt).toISOString()
    }, {
      component: "gateway",
      level: "warn"
    });
  }

  function dispatchJob(jobId, options = {}) {
    const job = db.prepare(`
      SELECT jobs.*, projects.process_params_json AS pp_json, projects.content_json, projects.layout_json
      FROM jobs
      INNER JOIN projects ON projects.id = jobs.project_id
      WHERE jobs.id = ?
    `).get(jobId);
    if (!job) return null;

    const deviceId = job.device_id;
    const session = sessions.get(deviceId);

    if (session && session.online) {
      // Real device mode: queue for device polling
      const queue = getPendingQueue(deviceId);
      const lease = inFlightJobs.get(deviceId);
      const alreadyQueued = queue.includes(jobId) || (lease && lease.jobId === jobId);
      if (!alreadyQueued) {
        queue.push(jobId);
      }

      db.prepare(`
        UPDATE jobs SET status = ?, progress_json = ?, updated_at = ?
        WHERE id = ?
      `).run(JOB.DISPATCHING, JSON.stringify({ percent: 5, currentStep: "dispatched" }), now(), jobId);

      app.logEvent("gateway_job_enqueued", {
        requestId: options.requestId || "",
        traceId: job.trace_id || "",
        jobId,
        deviceId,
        queueSize: queue.length
      }, {
        component: "gateway"
      });

      return { mode: "gateway", jobId };
    }

    // Simulation mode: use fake worker
    db.prepare(`
      UPDATE jobs SET status = ?, progress_json = ?, updated_at = ?
      WHERE id = ?
    `).run(JOB.DISPATCHING, JSON.stringify({ percent: 10, currentStep: "dispatching" }), now(), jobId);

    app.workerRuntime.enqueue(async () => {
      await app.workerTasks.runJob(jobId);
    });

    app.logEvent("gateway_job_dispatched_simulation", {
      requestId: options.requestId || "",
      traceId: job.trace_id || "",
      jobId,
      deviceId
    }, {
      component: "gateway"
    });

    return { mode: "simulation", jobId };
  }

  function getPendingJob(deviceId, options = {}) {
    releaseExpiredLease(deviceId, {
      requestId: options.requestId || "",
      tickId: options.tickId || ""
    });

    const activeLease = inFlightJobs.get(deviceId);
    if (activeLease) {
      return getPendingJobPayload(activeLease.jobId);
    }

    const queue = pendingJobs.get(deviceId);
    if (!queue || queue.length === 0) {
      return null;
    }

    const jobId = queue[0];
    inFlightJobs.set(deviceId, {
      jobId,
      leaseExpiresAt: Date.now() + dispatchLeaseMs
    });
    app.logEvent("gateway_job_leased", {
      requestId: options.requestId || "",
      deviceId,
      jobId,
      leaseMs: dispatchLeaseMs
    }, {
      component: "gateway"
    });
    return getPendingJobPayload(jobId);
  }

  function acknowledgeJob(deviceId, jobId, options = {}) {
    const queue = pendingJobs.get(deviceId);
    const lease = inFlightJobs.get(deviceId);
    if (queue && queue[0] === jobId && lease && lease.jobId === jobId) {
      queue.shift();
      inFlightJobs.delete(deviceId);
      if (queue.length === 0) pendingJobs.delete(deviceId);
      app.logEvent("gateway_job_acknowledged", {
        requestId: options.requestId || "",
        deviceId,
        jobId
      }, {
        component: "gateway"
      });
      return true;
    }
    return false;
  }

  function reportProgress(deviceId, jobId, status, percent, currentStep, options = {}) {
    // Validate device-reported status against current job state
    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId);
    if (!job) return;
    try {
      assertTransition(JOB, job.status, status, "job");
    } catch {
      app.logEvent("gateway_progress_rejected_transition", {
        requestId: options.requestId || "",
        traceId: job.trace_id || "",
        deviceId,
        jobId,
        fromStatus: job.status,
        toStatus: status
      }, {
        component: "gateway",
        level: "warn"
      });
      return; // Silently reject invalid transitions from device
    }

    if (status === JOB.RUNNING || status === JOB.COMPLETED || status === JOB.FAILED) {
      acknowledgeJob(deviceId, jobId, {
        requestId: options.requestId || ""
      });
    }

    if (status === JOB.RUNNING) {
      sessions.set(deviceId, { ...sessions.get(deviceId), online: true, currentJobId: jobId, lastHeartbeat: now() });
    }

    db.prepare(`
      UPDATE jobs SET status = ?, progress_json = ?, updated_at = ?
      WHERE id = ?
    `).run(status, JSON.stringify({ percent, currentStep }), now(), jobId);

    // Push event
    db.prepare("INSERT INTO job_events (id, job_id, status, at) VALUES (?, ?, ?, ?)")
      .run(`${jobId}_${status}_${Date.now()}`, jobId, status, now());

    app.logEvent("gateway_job_progress_applied", {
      requestId: options.requestId || "",
      traceId: job.trace_id || "",
      deviceId,
      jobId,
      status,
      percent,
      currentStep
    }, {
      component: "gateway"
    });

    if (status === JOB.COMPLETED || status === JOB.FAILED) {
      const s = sessions.get(deviceId);
      if (s) s.currentJobId = null;
    }
  }

  function handleHeartbeat(deviceId) {
    const existing = sessions.get(deviceId) || { online: true, currentJobId: null };
    existing.online = true;
    existing.lastHeartbeat = now();
    sessions.set(deviceId, existing);

    db.prepare(`
      UPDATE devices SET online_status = ?, last_seen_at = ?
      WHERE id = ?
    `).run("online", now(), deviceId);
  }

  function markOffline(deviceId, options = {}) {
    const s = sessions.get(deviceId);
    if (s) s.online = false;
    inFlightJobs.delete(deviceId);
    db.prepare(`
      UPDATE devices SET online_status = ?, last_seen_at = ?
      WHERE id = ?
    `).run("offline", now(), deviceId);
    app.logEvent("gateway_device_offline", {
      requestId: options.requestId || "",
      tickId: options.tickId || "",
      deviceId,
      lastHeartbeat: s && s.lastHeartbeat ? s.lastHeartbeat : ""
    }, {
      component: "gateway",
      level: "warn"
    });
  }

  function getDeviceStatus(deviceId) {
    return sessions.get(deviceId) || null;
  }

  // Stale detection: mark devices offline if no heartbeat in 60s
  const staleTimer = setInterval(() => {
    staleTickSeq += 1;
    const tickId = `gw_tick_${staleTickSeq}`;
    const deadline = Date.now() - heartbeatStaleMs;
    for (const [deviceId, session] of sessions) {
      if (session.lastHeartbeat && new Date(session.lastHeartbeat).getTime() < deadline) {
        markOffline(deviceId, { tickId });
      }
    }
  }, 30000);

  function close() {
    clearInterval(staleTimer);
  }

  return {
    dispatchJob,
    getPendingJob,
    acknowledgeJob,
    reportProgress,
    handleHeartbeat,
    markOffline,
    getDeviceStatus,
    verifyDeviceAuth,
    close
  };
}

module.exports = {
  createGatewayService
};
