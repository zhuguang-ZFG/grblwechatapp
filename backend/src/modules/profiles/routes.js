function registerProfilesRoutes(app) {
  app.get("/api/v1/machine-profiles", { preHandler: [app.authenticate] }, async () => {
    return app.profilesService.listMachineProfiles();
  });

  app.get("/api/v1/material-profiles", { preHandler: [app.authenticate] }, async () => {
    return app.profilesService.listMaterialProfiles();
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
