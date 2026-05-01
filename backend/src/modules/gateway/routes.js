const { sendError } = require("../../shared/http/error-response");
const { JOB } = require("../../shared/constants/statuses");

function validateProgressPayload(status, percent, currentStep) {
  const allowedStatus = new Set([
    JOB.DISPATCHING,
    JOB.RUNNING,
    JOB.COMPLETED,
    JOB.FAILED
  ]);
  if (status && !allowedStatus.has(status)) {
    return { ok: false, reason: "invalid_status" };
  }
  if (percent !== undefined && percent !== null) {
    if (typeof percent !== "number" || Number.isNaN(percent) || percent < 0 || percent > 100) {
      return { ok: false, reason: "invalid_percent" };
    }
  }
  if (currentStep !== undefined && currentStep !== null && typeof currentStep !== "string") {
    return { ok: false, reason: "invalid_current_step" };
  }
  return { ok: true };
}

function registerGatewayRoutes(app) {
  function requireDeviceAuth(deviceId, deviceToken, requestId, reply) {
    if (!deviceId || !deviceToken) {
      app.logEvent("gateway_auth_rejected", {
        requestId: requestId || "",
        reason: "missing_device_auth",
        deviceId: deviceId || ""
      }, {
        component: "gateway",
        level: "warn"
      });
      sendError(reply, 400, "missing_device_auth", "deviceId and deviceToken are required");
      return false;
    }
    if (!app.gatewayService.verifyDeviceAuth(deviceId, deviceToken)) {
      app.logEvent("gateway_auth_rejected", {
        requestId: requestId || "",
        reason: "invalid_device_auth",
        deviceId
      }, {
        component: "gateway",
        level: "warn"
      });
      sendError(reply, 401, "invalid_device_auth", "Device authentication failed");
      return false;
    }
    return true;
  }

  // Device heartbeat endpoint
  app.post("/api/v1/gateway/heartbeat", async (request, reply) => {
    const { deviceId, deviceToken } = request.body || {};
    if (!requireDeviceAuth(deviceId, deviceToken, request.requestId, reply)) {
      return;
    }
    app.gatewayService.handleHeartbeat(deviceId);
    const pending = app.gatewayService.getPendingJob(deviceId);
    app.logEvent("gateway_heartbeat", {
      requestId: request.requestId,
      deviceId,
      hasPendingJob: Boolean(pending),
      pendingJobId: pending ? pending.jobId : ""
    }, {
      component: "gateway"
    });
    return { status: "ok", hasPendingJob: !!pending, pendingJob: pending || undefined };
  });

  // Device polls for pending job
  app.get("/api/v1/gateway/jobs/pending", async (request, reply) => {
    const deviceId = request.query.deviceId || "";
    const deviceToken = request.query.deviceToken || "";
    if (!requireDeviceAuth(deviceId, deviceToken, request.requestId, reply)) {
      return;
    }
    const job = app.gatewayService.getPendingJob(deviceId, {
      requestId: request.requestId
    });
    app.logEvent("gateway_poll_pending", {
      requestId: request.requestId,
      deviceId,
      hasPendingJob: Boolean(job),
      pendingJobId: job ? job.jobId : ""
    }, {
      component: "gateway"
    });
    return { pending: !!job, job };
  });

  // Device reports job progress
  app.post("/api/v1/gateway/jobs/progress", async (request, reply) => {
    const { deviceId, deviceToken, jobId, status, percent, currentStep } = request.body || {};
    if (!requireDeviceAuth(deviceId, deviceToken, request.requestId, reply)) {
      return;
    }
    if (!jobId) {
      return sendError(reply, 400, "missing_job_id", "jobId is required");
    }
    const progressValidation = validateProgressPayload(status, percent, currentStep);
    if (!progressValidation.ok) {
      app.logEvent("gateway_progress_rejected", {
        requestId: request.requestId,
        deviceId,
        jobId,
        reason: progressValidation.reason
      }, {
        component: "gateway",
        level: "warn"
      });
      return sendError(reply, 400, "invalid_progress_payload", "Progress payload is invalid");
    }
    app.gatewayService.reportProgress(
      deviceId,
      jobId,
      status || JOB.RUNNING,
      typeof percent === "number" ? percent : 0,
      typeof currentStep === "string" ? currentStep : "",
      {
        requestId: request.requestId
      }
    );
    app.logEvent("gateway_progress_reported", {
      requestId: request.requestId,
      deviceId,
      jobId,
      status: status || JOB.RUNNING,
      percent: typeof percent === "number" ? percent : 0,
      currentStep: typeof currentStep === "string" ? currentStep : ""
    }, {
      component: "gateway"
    });
    return { status: "ok" };
  });

  // Dispatch job via gateway (authenticated)
  app.post("/api/v1/jobs/:id/dispatch", { preHandler: [app.authenticate] }, async (request, reply) => {
    const job = app.db.prepare(`
      SELECT jobs.* FROM jobs
      INNER JOIN projects ON projects.id = jobs.project_id
      WHERE jobs.id = ? AND projects.owner_user_id = ?
    `).get(request.params.id, request.currentUser.id);
    if (!job) {
      return sendError(reply, 404, "job_not_found", "Job was not found");
    }
    if (job.status !== "queued") {
      return sendError(reply, 409, "invalid_dispatch_target", "Job is not in queued state");
    }
    const result = app.gatewayService.dispatchJob(request.params.id, {
      requestId: request.requestId
    });
    return result;
  });
}

module.exports = {
  registerGatewayRoutes
};
