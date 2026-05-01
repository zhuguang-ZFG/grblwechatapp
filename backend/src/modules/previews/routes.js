const { sendError } = require("../../shared/http/error-response");

function registerPreviewRoutes(app) {
  app.post("/api/v1/projects/:id/preview", { preHandler: [app.authenticate] }, async (request, reply) => {
    const preview = app.previewsService.createPreview(request.currentUser.id, request.params.id);
    if (!preview) {
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    reply.code(201);
    return preview;
  });

  app.get("/api/v1/previews/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const preview = app.previewsService.getPreview(request.params.id);
    if (!preview) {
      return sendError(reply, 404, "preview_not_found", "Preview was not found");
    }
    return preview;
  });
}

module.exports = {
  registerPreviewRoutes
};
