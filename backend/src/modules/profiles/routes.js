const { sendError } = require("../../shared/http/error-response");

function registerProfilesRoutes(app) {
  function logProfileRoute(request, event, payload = {}, options = {}) {
    app.logEvent(event, {
      requestId: request.requestId,
      userId: request.currentUser ? request.currentUser.id : "",
      ...payload
    }, {
      component: "profiles",
      level: options.level || "info"
    });
  }

  app.get("/api/v1/machine-profiles", { preHandler: [app.authenticate] }, async (request) => {
    const items = app.profilesService.listMachineProfiles();
    logProfileRoute(request, "machine_profile_listed", {
      count: Array.isArray(items) ? items.length : 0
    });
    return items;
  });

  app.post("/api/v1/machine-profiles", { preHandler: [app.authenticate] }, async (request, reply) => {
    const profile = app.profilesService.createMachineProfile(request.currentUser.id, request.body);
    logProfileRoute(request, "machine_profile_created", {
      profileId: profile.id || ""
    });
    reply.code(201);
    return profile;
  });

  app.put("/api/v1/machine-profiles/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.profilesService.updateMachineProfile(request.currentUser.id, request.params.id, request.body);
    if (!result) {
      logProfileRoute(request, "machine_profile_update_rejected", {
        profileId: request.params.id,
        reason: "profile_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "profile_not_found", "Machine profile was not found or not owned by user");
    }
    logProfileRoute(request, "machine_profile_updated", {
      profileId: request.params.id
    });
    return result;
  });

  app.delete("/api/v1/machine-profiles/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.profilesService.deleteMachineProfile(request.currentUser.id, request.params.id);
    if (!result) {
      logProfileRoute(request, "machine_profile_delete_rejected", {
        profileId: request.params.id,
        reason: "profile_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "profile_not_found", "Machine profile was not found or not owned by user");
    }
    logProfileRoute(request, "machine_profile_deleted", {
      profileId: request.params.id
    });
    return result;
  });

  app.get("/api/v1/machine-profiles/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const profile = app.profilesService.getMachineProfile(request.params.id);
    if (!profile) {
      logProfileRoute(request, "machine_profile_get_rejected", {
        profileId: request.params.id,
        reason: "profile_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "profile_not_found", "Machine profile was not found");
    }
    logProfileRoute(request, "machine_profile_fetched", {
      profileId: request.params.id
    });
    return profile;
  });

  app.get("/api/v1/material-profiles", { preHandler: [app.authenticate] }, async (request) => {
    const items = app.profilesService.listMaterialProfiles();
    logProfileRoute(request, "material_profile_listed", {
      count: Array.isArray(items) ? items.length : 0
    });
    return items;
  });

  app.post("/api/v1/material-profiles", { preHandler: [app.authenticate] }, async (request, reply) => {
    const profile = app.profilesService.createMaterialProfile(request.currentUser.id, request.body);
    logProfileRoute(request, "material_profile_created", {
      profileId: profile.id || ""
    });
    reply.code(201);
    return profile;
  });

  app.put("/api/v1/material-profiles/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.profilesService.updateMaterialProfile(request.currentUser.id, request.params.id, request.body);
    if (!result) {
      logProfileRoute(request, "material_profile_update_rejected", {
        profileId: request.params.id,
        reason: "profile_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "profile_not_found", "Material profile was not found or not owned by user");
    }
    logProfileRoute(request, "material_profile_updated", {
      profileId: request.params.id
    });
    return result;
  });

  app.delete("/api/v1/material-profiles/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.profilesService.deleteMaterialProfile(request.currentUser.id, request.params.id);
    if (!result) {
      logProfileRoute(request, "material_profile_delete_rejected", {
        profileId: request.params.id,
        reason: "profile_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "profile_not_found", "Material profile was not found or not owned by user");
    }
    logProfileRoute(request, "material_profile_deleted", {
      profileId: request.params.id
    });
    return result;
  });

  app.get("/api/v1/material-profiles/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const profile = app.profilesService.getMaterialProfile(request.params.id);
    if (!profile) {
      logProfileRoute(request, "material_profile_get_rejected", {
        profileId: request.params.id,
        reason: "profile_not_found"
      }, { level: "warn" });
      return sendError(reply, 404, "profile_not_found", "Material profile was not found");
    }
    logProfileRoute(request, "material_profile_fetched", {
      profileId: request.params.id
    });
    return profile;
  });

  app.get("/api/v1/fonts", { preHandler: [app.authenticate] }, async (request) => {
    const items = app.profilesService.listFonts();
    logProfileRoute(request, "font_listed", {
      count: Array.isArray(items) ? items.length : 0
    });
    return items;
  });

  app.get("/api/v1/image-processors", { preHandler: [app.authenticate] }, async (request) => {
    const items = app.profilesService.listImageProcessors();
    logProfileRoute(request, "image_processor_listed", {
      count: Array.isArray(items) ? items.length : 0
    });
    return items;
  });
}

module.exports = {
  registerProfilesRoutes
};
