const { sendError } = require("../../shared/http/error-response");

function registerGenerationRoutes(app) {
  function logGenerationRoute(request, event, payload = {}, options = {}) {
    app.logEvent(event, {
      requestId: request.requestId,
      userId: request.currentUser ? request.currentUser.id : "",
      ...payload
    }, {
      component: "generations",
      level: options.level || "info"
    });
  }

  app.post("/api/v1/projects/:id/generate", { preHandler: [app.authenticate] }, async (request, reply) => {
    const generation = app.generationsService.createGeneration(
      request.currentUser.id,
      request.params.id,
      request.body.previewId
    );

    if (!generation) {
      logGenerationRoute(request, "generation_create_rejected", {
        projectId: request.params.id,
        previewId: request.body ? request.body.previewId : "",
        reason: "generation_input_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "generation_input_not_found", "Project or preview was not found");
    }

    logGenerationRoute(request, "generation_created", {
      projectId: request.params.id,
      generationId: generation.generationId,
      previewId: request.body ? request.body.previewId : ""
    });
    reply.code(201);
    return generation;
  });

  app.get("/api/v1/generations/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const generation = app.generationsService.getGeneration(request.params.id);
    if (!generation) {
      logGenerationRoute(request, "generation_get_rejected", {
        generationId: request.params.id,
        reason: "generation_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "generation_not_found", "Generation was not found");
    }
    logGenerationRoute(request, "generation_fetched", {
      generationId: request.params.id,
      status: generation.status
    });
    return generation;
  });
}

module.exports = {
  registerGenerationRoutes
};
