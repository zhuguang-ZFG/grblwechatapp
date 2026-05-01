const Fastify = require("fastify");
const path = require("path");
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
const { createTemplatesService } = require("./modules/templates/service");
const { registerTemplatesRoutes } = require("./modules/templates/routes");
const { createGatewayService } = require("./modules/gateway/service");
const { registerGatewayRoutes } = require("./modules/gateway/routes");

const MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".gcode": "text/plain",
  ".txt": "text/plain",
  ".json": "application/json"
};

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
  app.decorate("templatesService", createTemplatesService(app));
  app.decorate("gatewayService", createGatewayService(app));

  app.get("/health", async () => ({ ok: true }));

  // Static file serving for stored artifacts
  app.get("/storage/*", async (request, reply) => {
    const relativePath = request.params["*"];
    if (!relativePath || relativePath.includes("..")) {
      reply.code(404).send({ error: "not_found" });
      return;
    }
    if (!app.artifacts.exists(relativePath)) {
      reply.code(404).send({ error: "not_found" });
      return;
    }
    const ext = path.extname(relativePath).toLowerCase();
    reply.header("Content-Type", MIME_TYPES[ext] || "application/octet-stream");
    return app.artifacts.readBinary(relativePath);
  });

  registerAuthRoutes(app);
  registerDevicesRoutes(app);
  registerProjectsRoutes(app);
  registerPreviewRoutes(app);
  registerGenerationRoutes(app);
  registerJobRoutes(app);
  registerProfilesRoutes(app);
  registerTemplatesRoutes(app);
  registerGatewayRoutes(app);

  // Dashboard stats
  app.get("/api/v1/dashboard/stats", { preHandler: [app.authenticate] }, async (request) => {
    const userId = request.currentUser.id;
    const db = app.db;
    const projectCount = db.prepare("SELECT COUNT(*) AS c FROM projects WHERE owner_user_id = ?").get(userId).c;
    const jobCounts = db.prepare(`
      SELECT status, COUNT(*) AS c FROM jobs
      INNER JOIN projects ON projects.id = jobs.project_id
      WHERE projects.owner_user_id = ?
      GROUP BY status
    `).all(userId);
    const deviceCount = db.prepare("SELECT COUNT(*) AS c FROM devices WHERE owner_user_id = ?").get(userId).c;
    const counts = { queued: 0, dispatching: 0, running: 0, completed: 0, failed: 0, canceled: 0 };
    jobCounts.forEach((row) => { counts[row.status] = row.c; });
    return {
      projectCount,
      jobCounts: counts,
      deviceCount,
      totalJobs: Object.values(counts).reduce((a, b) => a + b, 0)
    };
  });

  // Global search
  app.get("/api/v1/search", { preHandler: [app.authenticate] }, async (request) => {
    const userId = request.currentUser.id;
    const q = (request.query.q || "").trim();
    if (!q) return { projects: [], templates: [] };
    const like = `%${q}%`;
    const db = app.db;
    const projects = db.prepare(`
      SELECT id, name, source_type, status FROM projects
      WHERE owner_user_id = ? AND (name LIKE ? OR id LIKE ?)
      LIMIT 10
    `).all(userId, like, like).map((r) => ({ id: r.id, name: r.name, type: r.source_type, status: r.status }));
    const templates = db.prepare(`
      SELECT id, name, description, source_type, category FROM templates
      WHERE name LIKE ? OR description LIKE ?
      LIMIT 10
    `).all(like, like).map((r) => ({ id: r.id, name: r.name, description: r.description, sourceType: r.source_type, category: r.category }));
    return { projects, templates };
  });

  app.addHook("onClose", async () => {
    app.workerRuntime.close();
    app.gatewayService.close();
    app.previewsService.close();
    app.generationsService.close();
    app.db.close();
  });

  return app;
}

module.exports = {
  buildApp
};
