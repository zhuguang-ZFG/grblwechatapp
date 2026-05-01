const { sendError } = require("../../shared/http/error-response");

function registerProfilesRoutes(app) {
  app.get("/api/v1/machine-profiles", { preHandler: [app.authenticate] }, async () => {
    return app.profilesService.listMachineProfiles();
  });

  app.post("/api/v1/machine-profiles", { preHandler: [app.authenticate] }, async (request, reply) => {
    const profile = app.profilesService.createMachineProfile(request.currentUser.id, request.body);
    reply.code(201);
    return profile;
  });

  app.put("/api/v1/machine-profiles/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.profilesService.updateMachineProfile(request.currentUser.id, request.params.id, request.body);
    if (!result) {
      return sendError(reply, 404, "profile_not_found", "Machine profile was not found or not owned by user");
    }
    return result;
  });

  app.delete("/api/v1/machine-profiles/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.profilesService.deleteMachineProfile(request.currentUser.id, request.params.id);
    if (!result) {
      return sendError(reply, 404, "profile_not_found", "Machine profile was not found or not owned by user");
    }
    return result;
  });

  app.get("/api/v1/machine-profiles/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const profile = app.profilesService.getMachineProfile(request.params.id);
    if (!profile) {
      return sendError(reply, 404, "profile_not_found", "Machine profile was not found");
    }
    return profile;
  });

  app.get("/api/v1/material-profiles", { preHandler: [app.authenticate] }, async () => {
    return app.profilesService.listMaterialProfiles();
  });

  app.post("/api/v1/material-profiles", { preHandler: [app.authenticate] }, async (request, reply) => {
    const profile = app.profilesService.createMaterialProfile(request.currentUser.id, request.body);
    reply.code(201);
    return profile;
  });

  app.put("/api/v1/material-profiles/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.profilesService.updateMaterialProfile(request.currentUser.id, request.params.id, request.body);
    if (!result) {
      return sendError(reply, 404, "profile_not_found", "Material profile was not found or not owned by user");
    }
    return result;
  });

  app.delete("/api/v1/material-profiles/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.profilesService.deleteMaterialProfile(request.currentUser.id, request.params.id);
    if (!result) {
      return sendError(reply, 404, "profile_not_found", "Material profile was not found or not owned by user");
    }
    return result;
  });

  app.get("/api/v1/material-profiles/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const profile = app.profilesService.getMaterialProfile(request.params.id);
    if (!profile) {
      return sendError(reply, 404, "profile_not_found", "Material profile was not found");
    }
    return profile;
  });

  app.get("/api/v1/fonts", { preHandler: [app.authenticate] }, async () => {
    return app.profilesService.listFonts();
  });

  app.get("/api/v1/image-processors", { preHandler: [app.authenticate] }, async () => {
    return app.profilesService.listImageProcessors();
  });
}

module.exports = {
  registerProfilesRoutes
};
