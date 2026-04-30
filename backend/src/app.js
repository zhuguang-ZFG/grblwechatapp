const Fastify = require("fastify");
const envDefaults = require("./config/env");
const { createDatabase } = require("./shared/db");
const { createArtifactStore } = require("./shared/storage/artifact-store");

function buildApp(options = {}) {
  const env = Object.assign({}, envDefaults, options.env || {});
  const app = Fastify({ logger: false });

  app.decorate("env", env);
  app.decorate("db", createDatabase(env.databaseFile));
  app.decorate("artifacts", createArtifactStore(env.storageDir));

  app.get("/health", async () => ({ ok: true }));

  app.addHook("onClose", async () => {
    app.db.close();
  });

  return app;
}

module.exports = {
  buildApp
};
