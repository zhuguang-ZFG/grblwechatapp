const { sendError } = require("../../shared/http/error-response");

function registerProjectsRoutes(app) {
  app.post("/api/v1/projects", { preHandler: [app.authenticate] }, async (request) => {
    return app.projectsService.createProject(request.currentUser.id, request.body);
  });

  app.get("/api/v1/projects", { preHandler: [app.authenticate] }, async (request) => {
    return app.projectsService.listProjects(request.currentUser.id);
  });

  app.get("/api/v1/projects/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const project = app.projectsService.getProject(request.currentUser.id, request.params.id);
    if (!project) {
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    return project;
  });

  app.put("/api/v1/projects/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const project = app.projectsService.updateProject(request.currentUser.id, request.params.id, request.body);
    if (!project) {
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    return project;
  });

  app.post("/api/v1/projects/:id/duplicate", { preHandler: [app.authenticate] }, async (request, reply) => {
    const project = app.projectsService.duplicateProject(request.currentUser.id, request.params.id);
    if (!project) {
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    return project;
  });

  app.post("/api/v1/projects/:id/archive", { preHandler: [app.authenticate] }, async (request, reply) => {
    const project = app.projectsService.archiveProject(request.currentUser.id, request.params.id);
    if (!project) {
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    return project;
  });

  app.delete("/api/v1/projects/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.projectsService.deleteProject(request.currentUser.id, request.params.id);
    if (!result) {
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    return result;
  });
}

module.exports = {
  registerProjectsRoutes
};
