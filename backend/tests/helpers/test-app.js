const fs = require("fs");
const os = require("os");
const path = require("path");
const { buildApp } = require("../../src/app");

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function createTestApp(options = {}) {
  const rootDir = makeTempDir("kxapp-backend-");
  const envOverrides = options.env || {};
  const app = buildApp({
    env: {
      port: 0,
      host: "127.0.0.1",
      databaseFile: path.join(rootDir, "test.db"),
      storageDir: path.join(rootDir, "storage"),
      ...envOverrides
    }
  });

  return {
    app,
    rootDir
  };
}

module.exports = {
  createTestApp
};
