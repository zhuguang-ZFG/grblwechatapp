const { sendError } = require("../../shared/http/error-response");

function registerTemplatesRoutes(app) {
  app.get("/api/v1/templates", { preHandler: [app.authenticate] }, async (request) => {
    const category = request.query.category || "";
    return app.templatesService.listTemplates(category);
  });

  app.get("/api/v1/templates/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const template = app.templatesService.getTemplate(request.params.id);
    if (!template) {
      return sendError(reply, 404, "template_not_found", "Template was not found");
    }
    return template;
  });

  app.post("/api/v1/templates", { preHandler: [app.authenticate] }, async (request, reply) => {
    const template = app.templatesService.createTemplate(request.currentUser.id, request.body);
    reply.code(201);
    return template;
  });

  app.put("/api/v1/templates/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.templatesService.updateTemplate(request.currentUser.id, request.params.id, request.body);
    if (!result) {
      return sendError(reply, 404, "template_not_found", "Template was not found or not owned by user");
    }
    return result;
  });

  app.delete("/api/v1/templates/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.templatesService.deleteTemplate(request.currentUser.id, request.params.id);
    if (!result) {
      return sendError(reply, 404, "template_not_found", "Template was not found or not owned by user");
    }
    return result;
  });

  app.post("/api/v1/templates/:id/apply", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.templatesService.applyTemplate(request.currentUser.id, request.params.id);
    if (!result) {
      return sendError(reply, 404, "template_not_found", "Template was not found");
    }
    return result;
  });
}

module.exports = {
  registerTemplatesRoutes
};
