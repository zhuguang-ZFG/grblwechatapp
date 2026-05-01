const { sendError } = require("../../shared/http/error-response");

function registerJobRoutes(app) {
  app.post("/api/v1/jobs", { preHandler: [app.authenticate] }, async (request, reply) => {
    const job = app.jobsService.createJob(request.currentUser.id, request.body);
    if (!job) {
      return sendError(reply, 404, "job_input_not_found", "Project, generation, or device was not found");
    }
    reply.code(201);
    return job;
  });

  app.get("/api/v1/jobs", { preHandler: [app.authenticate] }, async (request) => {
    return app.jobsService.listJobs(request.currentUser.id, request.query.status, request.query.failureCategory);
  });

  app.get("/api/v1/jobs/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const job = app.jobsService.getJob(request.currentUser.id, request.params.id);
    if (!job) {
      return sendError(reply, 404, "job_not_found", "Job was not found");
    }
    return job;
  });

  app.post("/api/v1/jobs/:id/cancel", { preHandler: [app.authenticate] }, async (request, reply) => {
    const job = app.jobsService.cancelJob(request.currentUser.id, request.params.id);
    if (!job) {
      return sendError(reply, 404, "job_not_found", "Job was not found");
    }
    if (job.error) {
      return sendError(reply, 409, job.error.code, job.error.message);
    }
    return job;
  });

  app.post("/api/v1/jobs/:id/retry", { preHandler: [app.authenticate] }, async (request, reply) => {
    const job = app.jobsService.retryJob(request.currentUser.id, request.params.id);
    if (!job) {
      return sendError(reply, 404, "job_not_found", "Job was not found");
    }
    if (job.error) {
      return sendError(reply, 409, job.error.code, job.error.message);
    }
    return job;
  });
}

module.exports = {
  registerJobRoutes
};
