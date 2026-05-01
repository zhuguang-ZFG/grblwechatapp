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

  app.post("/api/v1/projects/:id/restore", { preHandler: [app.authenticate] }, async (request, reply) => {
    const project = app.projectsService.restoreProject(request.currentUser.id, request.params.id);
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

  app.get("/api/v1/projects/:id/preflight", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.projectsService.preflightCheck(request.currentUser.id, request.params.id);
    return result;
  });

  app.get("/api/v1/projects/:id/export", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.projectsService.exportProject(request.currentUser.id, request.params.id);
    if (!result) {
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    return result;
  });

  app.post("/api/v1/projects/import", { preHandler: [app.authenticate] }, async (request) => {
    return app.projectsService.importProject(request.currentUser.id, request.body);
  });

  app.post("/api/v1/projects/:id/assets", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.projectsService.createAsset(request.currentUser.id, request.params.id, request.body);
    if (!result) {
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    return result;
  });
}

module.exports = {
  registerProjectsRoutes
};
