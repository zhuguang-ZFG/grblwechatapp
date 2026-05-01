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
const { createWorkerRuntime } = require("./workers/runtime");
const { createWorkerTasks } = require("./workers/tasks");
const { createPreviewsService } = require("./modules/previews/service");
const { registerPreviewRoutes } = require("./modules/previews/routes");
const { createGenerationsService } = require("./modules/generations/service");
const { registerGenerationRoutes } = require("./modules/generations/routes");
const { createJobsService } = require("./modules/jobs/service");
const { registerJobRoutes } = require("./modules/jobs/routes");
const { createProfilesService } = require("./modules/profiles/service");
const { registerProfilesRoutes } = require("./modules/profiles/routes");

function buildApp(options = {}) {
  const env = Object.assign({}, envDefaults, options.env || {});
  const app = Fastify({ logger: false });

  app.decorate("env", env);
  app.decorate("db", createDatabase(env.databaseFile));
  app.decorate("artifacts", createArtifactStore(env.storageDir));
  app.decorate("workerRuntime", createWorkerRuntime());
  registerAuthGuard(app);
  app.decorate("authService", createAuthService(app));
  app.decorate("devicesService", createDevicesService(app));
  app.decorate("projectsService", createProjectsService(app));
  app.decorate("previewsService", createPreviewsService(app));
  app.decorate("generationsService", createGenerationsService(app));
  app.decorate("jobsService", createJobsService(app));
  app.decorate("workerTasks", createWorkerTasks(app));
  app.decorate("profilesService", createProfilesService(app));

  app.get("/health", async () => ({ ok: true }));
  registerAuthRoutes(app);
  registerDevicesRoutes(app);
  registerProjectsRoutes(app);
  registerPreviewRoutes(app);
  registerGenerationRoutes(app);
  registerJobRoutes(app);
  registerProfilesRoutes(app);

  app.addHook("onClose", async () => {
    app.workerRuntime.close();
    app.db.close();
  });

  return app;
}

module.exports = {
  buildApp
};
