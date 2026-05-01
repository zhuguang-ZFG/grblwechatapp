const { sendError } = require("../../shared/http/error-response");

function registerPreviewRoutes(app) {
  function logPreviewRoute(request, event, payload = {}, options = {}) {
    app.logEvent(event, {
      requestId: request.requestId,
      userId: request.currentUser ? request.currentUser.id : "",
      ...payload
    }, {
      component: "previews",
      level: options.level || "info"
    });
  }

  app.post("/api/v1/projects/:id/preview", { preHandler: [app.authenticate] }, async (request, reply) => {
    const preview = app.previewsService.createPreview(request.currentUser.id, request.params.id);
    if (!preview) {
      logPreviewRoute(request, "preview_create_rejected", {
        projectId: request.params.id,
        reason: "project_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    logPreviewRoute(request, "preview_created", {
      projectId: request.params.id,
      previewId: preview.previewId
    });
    reply.code(201);
    return preview;
  });

  app.get("/api/v1/previews/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const preview = app.previewsService.getPreview(request.params.id);
    if (!preview) {
      logPreviewRoute(request, "preview_get_rejected", {
        previewId: request.params.id,
        reason: "preview_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "preview_not_found", "Preview was not found");
    }
    logPreviewRoute(request, "preview_fetched", {
      previewId: request.params.id,
      status: preview.status
    });
    return preview;
  });
}

module.exports = {
  registerPreviewRoutes
};
