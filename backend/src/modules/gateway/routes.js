const { sendError } = require("../../shared/http/error-response");

function registerGatewayRoutes(app) {
  // Device heartbeat endpoint
  app.post("/api/v1/gateway/heartbeat", async (request, reply) => {
    const { deviceId } = request.body || {};
    if (!deviceId) {
      return sendError(reply, 400, "missing_device_id", "Device ID is required");
    }
    app.gatewayService.handleHeartbeat(deviceId);
    const pending = app.gatewayService.getPendingJob(deviceId);
    return { status: "ok", hasPendingJob: !!pending, pendingJob: pending || undefined };
  });

  // Device polls for pending job
  app.get("/api/v1/gateway/jobs/pending", async (request) => {
    const deviceId = request.query.deviceId || "";
    if (!deviceId) return { pending: false, job: null };
    const job = app.gatewayService.getPendingJob(deviceId);
    return { pending: !!job, job };
  });

  // Device reports job progress
  app.post("/api/v1/gateway/jobs/progress", async (request, reply) => {
    const { deviceId, jobId, status, percent, currentStep } = request.body || {};
    if (!deviceId || !jobId) {
      return sendError(reply, 400, "missing_fields", "deviceId and jobId are required");
    }
    app.gatewayService.reportProgress(deviceId, jobId, status || "running", percent || 0, currentStep || "");
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
    const result = app.gatewayService.dispatchJob(request.params.id);
    return result;
  });
}

module.exports = {
  registerGatewayRoutes
};
