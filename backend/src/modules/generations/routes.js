const { sendError } = require("../../shared/http/error-response");

function registerGenerationRoutes(app) {
  app.post("/api/v1/projects/:id/generate", { preHandler: [app.authenticate] }, async (request, reply) => {
    const generation = app.generationsService.createGeneration(
      request.currentUser.id,
      request.params.id,
      request.body.previewId
    );

    if (!generation) {
      return sendError(reply, 404, "generation_input_not_found", "Project or preview was not found");
    }

    reply.code(201);
    return generation;
  });

  app.get("/api/v1/generations/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const generation = app.generationsService.getGeneration(request.params.id);
    if (!generation) {
      return sendError(reply, 404, "generation_not_found", "Generation was not found");
    }
    return generation;
  });
}

module.exports = {
  registerGenerationRoutes
};
