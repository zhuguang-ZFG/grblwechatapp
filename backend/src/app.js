const Fastify = require("fastify");
const envDefaults = require("./config/env");
const { createDatabase } = require("./shared/db");
const { createArtifactStore } = require("./shared/storage/artifact-store");
const { registerAuthGuard } = require("./shared/http/auth-guard");
const { createAuthService } = require("./modules/auth/service");
const { registerAuthRoutes } = require("./modules/auth/routes");
const { createDevicesService } = require("./modules/devices/service");
const { registerDevicesRoutes } = require("./modules/devices/routes");
const { createProjectsService } = require("./modules/projects/service");
const { registerProjectsRoutes } = require("./modules/projects/routes");

function buildApp(options = {}) {
  const env = Object.assign({}, envDefaults, options.env || {});
  const app = Fastify({ logger: false });

  app.decorate("env", env);
  app.decorate("db", createDatabase(env.databaseFile));
  app.decorate("artifacts", createArtifactStore(env.storageDir));
  registerAuthGuard(app);
  app.decorate("authService", createAuthService(app));
  app.decorate("devicesService", createDevicesService(app));
  app.decorate("projectsService", createProjectsService(app));

  app.get("/health", async () => ({ ok: true }));
  registerAuthRoutes(app);
  registerDevicesRoutes(app);
  registerProjectsRoutes(app);

  app.addHook("onClose", async () => {
    app.db.close();
  });

  return app;
}

module.exports = {
  buildApp
};
