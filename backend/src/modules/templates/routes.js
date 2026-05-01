const { sendError } = require("../../shared/http/error-response");

function registerTemplatesRoutes(app) {
  function logTemplateRoute(request, event, payload = {}, options = {}) {
    app.logEvent(event, {
      requestId: request.requestId,
      userId: request.currentUser ? request.currentUser.id : "",
      ...payload
    }, {
      component: "templates",
      level: options.level || "info"
    });
  }

  app.get("/api/v1/templates", { preHandler: [app.authenticate] }, async (request) => {
    const category = request.query.category || "";
    const items = app.templatesService.listTemplates(category);
    logTemplateRoute(request, "template_listed", {
      category,
      count: Array.isArray(items) ? items.length : 0
    });
    return items;
  });

  app.get("/api/v1/templates/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const template = app.templatesService.getTemplate(request.params.id);
    if (!template) {
      logTemplateRoute(request, "template_get_rejected", {
        templateId: request.params.id,
        reason: "template_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "template_not_found", "Template was not found");
    }
    logTemplateRoute(request, "template_fetched", {
      templateId: request.params.id
    });
    return template;
  });

  app.post("/api/v1/templates", { preHandler: [app.authenticate] }, async (request, reply) => {
    const template = app.templatesService.createTemplate(request.currentUser.id, request.body);
    logTemplateRoute(request, "template_created", {
      templateId: template.id || ""
    });
    reply.code(201);
    return template;
  });

  app.put("/api/v1/templates/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.templatesService.updateTemplate(request.currentUser.id, request.params.id, request.body);
    if (!result) {
      logTemplateRoute(request, "template_update_rejected", {
        templateId: request.params.id,
        reason: "template_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "template_not_found", "Template was not found or not owned by user");
    }
    logTemplateRoute(request, "template_updated", {
      templateId: request.params.id
    });
    return result;
  });

  app.delete("/api/v1/templates/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.templatesService.deleteTemplate(request.currentUser.id, request.params.id);
    if (!result) {
      logTemplateRoute(request, "template_delete_rejected", {
        templateId: request.params.id,
        reason: "template_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "template_not_found", "Template was not found or not owned by user");
    }
    logTemplateRoute(request, "template_deleted", {
      templateId: request.params.id
    });
    return result;
  });

  app.post("/api/v1/templates/:id/apply", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.templatesService.applyTemplate(request.currentUser.id, request.params.id);
    if (!result) {
      logTemplateRoute(request, "template_apply_rejected", {
        templateId: request.params.id,
        reason: "template_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "template_not_found", "Template was not found");
    }
    logTemplateRoute(request, "template_applied", {
      templateId: request.params.id,
      projectId: result.id || ""
    });
    return result;
  });
}

module.exports = {
  registerTemplatesRoutes
};
