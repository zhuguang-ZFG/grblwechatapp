const { sendError } = require("../../shared/http/error-response");

function registerProjectsRoutes(app) {
  function logProjectRoute(request, event, payload = {}, options = {}) {
    app.logEvent(event, {
      requestId: request.requestId,
      userId: request.currentUser ? request.currentUser.id : "",
      ...payload
    }, {
      component: "projects",
      level: options.level || "info"
    });
  }

  app.post("/api/v1/projects", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.projectsService.createProject(request.currentUser.id, request.body);
    logProjectRoute(request, "project_created", {
      projectId: result.id
    });
    reply.code(201);
    return result;
  });

  app.get("/api/v1/projects", { preHandler: [app.authenticate] }, async (request) => {
    return app.projectsService.listProjects(request.currentUser.id);
  });

  app.get("/api/v1/projects/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const project = app.projectsService.getProject(request.currentUser.id, request.params.id);
    if (!project) {
      logProjectRoute(request, "project_get_rejected", {
        projectId: request.params.id,
        reason: "project_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    return project;
  });

  app.put("/api/v1/projects/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const project = app.projectsService.updateProject(request.currentUser.id, request.params.id, request.body);
    if (!project) {
      logProjectRoute(request, "project_update_rejected", {
        projectId: request.params.id,
        reason: "project_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    logProjectRoute(request, "project_updated", {
      projectId: request.params.id
    });
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
    const result = app.projectsService.archiveProject(request.currentUser.id, request.params.id);
    if (!result) {
      logProjectRoute(request, "project_archive_rejected", {
        projectId: request.params.id,
        reason: "project_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    if (result.error) {
      logProjectRoute(request, "project_archive_rejected", {
        projectId: request.params.id,
        reason: result.error.code
      }, { level: "warn" });
      return sendError(reply, 409, result.error.code, result.error.message);
    }
    logProjectRoute(request, "project_archived", {
      projectId: request.params.id
    });
    return result;
  });

  app.post("/api/v1/projects/:id/restore", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.projectsService.restoreProject(request.currentUser.id, request.params.id);
    if (!result) {
      logProjectRoute(request, "project_restore_rejected", {
        projectId: request.params.id,
        reason: "project_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    if (result.error) {
      logProjectRoute(request, "project_restore_rejected", {
        projectId: request.params.id,
        reason: result.error.code
      }, { level: "warn" });
      return sendError(reply, 409, result.error.code, result.error.message);
    }
    logProjectRoute(request, "project_restored", {
      projectId: request.params.id
    });
    return result;
  });

  app.delete("/api/v1/projects/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.projectsService.deleteProject(request.currentUser.id, request.params.id);
    if (!result) {
      logProjectRoute(request, "project_delete_rejected", {
        projectId: request.params.id,
        reason: "project_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    logProjectRoute(request, "project_deleted", {
      projectId: request.params.id
    });
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
    const result = app.projectsService.importProject(request.currentUser.id, request.body);
    logProjectRoute(request, "project_imported", {
      projectId: result.id
    });
    return result;
  });

  app.post("/api/v1/projects/:id/assets", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.projectsService.createAsset(request.currentUser.id, request.params.id, request.body);
    if (!result) {
      logProjectRoute(request, "project_asset_create_rejected", {
        projectId: request.params.id,
        reason: "project_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    logProjectRoute(request, "project_asset_created", {
      projectId: request.params.id,
      assetId: result.id || ""
    });
    return result;
  });
}

module.exports = {
  registerProjectsRoutes
};
