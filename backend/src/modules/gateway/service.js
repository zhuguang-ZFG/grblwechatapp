const { JOB, assertTransition } = require("../../shared/constants/statuses");

function now() {
  return new Date().toISOString();
}

function createGatewayService(app) {
  const db = app.db;

  // In-memory device sessions
  const sessions = new Map();
  const pendingJobs = new Map(); // deviceId -> [jobId, ...]

  function dispatchJob(jobId) {
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
      if (!pendingJobs.has(deviceId)) {
        pendingJobs.set(deviceId, []);
      }
      pendingJobs.get(deviceId).push(jobId);

      db.prepare(`
        UPDATE jobs SET status = ?, progress_json = ?, updated_at = ?
        WHERE id = ?
      `).run(JOB.DISPATCHING, JSON.stringify({ percent: 5, currentStep: "dispatched" }), now(), jobId);

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

    return { mode: "simulation", jobId };
  }

  function getPendingJob(deviceId) {
    const queue = pendingJobs.get(deviceId);
    if (!queue || queue.length === 0) return null;
    const jobId = queue[0];
    const gen = db.prepare(`
      SELECT generations.gcode_asset_path FROM generations
      INNER JOIN jobs ON jobs.generation_id = generations.id
      WHERE jobs.id = ?
    `).get(jobId);
    return gen ? { jobId, gcodeAssetPath: gen.gcode_asset_path } : null;
  }

  function acknowledgeJob(deviceId, jobId) {
    const queue = pendingJobs.get(deviceId);
    if (queue && queue[0] === jobId) {
      queue.shift();
      if (queue.length === 0) pendingJobs.delete(deviceId);
    }
  }

  function reportProgress(deviceId, jobId, status, percent, currentStep) {
    // Validate device-reported status against current job state
    const job = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId);
    if (!job) return;
    try {
      assertTransition(JOB, job.status, status, "job");
    } catch {
      return; // Silently reject invalid transitions from device
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

    if (status === JOB.COMPLETED || status === JOB.FAILED) {
      acknowledgeJob(deviceId, jobId);
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

  function markOffline(deviceId) {
    const s = sessions.get(deviceId);
    if (s) s.online = false;
    db.prepare(`
      UPDATE devices SET online_status = ?, last_seen_at = ?
      WHERE id = ?
    `).run("offline", now(), deviceId);
  }

  function getDeviceStatus(deviceId) {
    return sessions.get(deviceId) || null;
  }

  // Stale detection: mark devices offline if no heartbeat in 60s
  const staleTimer = setInterval(() => {
    const deadline = Date.now() - 60000;
    for (const [deviceId, session] of sessions) {
      if (session.lastHeartbeat && new Date(session.lastHeartbeat).getTime() < deadline) {
        markOffline(deviceId);
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
    close
  };
}

module.exports = {
  createGatewayService
};
