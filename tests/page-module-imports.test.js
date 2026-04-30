const assert = require("assert");
const path = require("path");

const pageFiles = [
  "../miniprogram/pages/tasks/index.js",
  "../miniprogram/pages/devices/index.js",
  "../miniprogram/pages/workspace/index.js",
  "../miniprogram/pages/projects/index.js",
  "../miniprogram/pages/preview/index.js",
  "../miniprogram/pages/profile/index.js"
];

const stubs = [
  "../miniprogram/services/api/index.js",
  "../miniprogram/utils/page-auth.js",
  "../miniprogram/utils/status-formatters.js",
  "../miniprogram/utils/project-formatters.js"
];

function stubModule(relativePath, exportsValue) {
  const modulePath = path.resolve(__dirname, relativePath);
  require.cache[modulePath] = {
    id: modulePath,
    filename: modulePath,
    loaded: true,
    exports: exportsValue
  };
}

function clearModules() {
  pageFiles.forEach((relativePath) => {
    delete require.cache[path.resolve(__dirname, relativePath)];
  });
}

function installStubs() {
  stubModule("../miniprogram/services/api/index.js", {
    listJobs: async () => ({ items: [] }),
    listDevices: async () => ({ items: [] }),
    listProjects: async () => [],
    getSelectedDevice: () => ({}),
    createProject: async () => ({ id: "prj_1" }),
    getPreview: async () => ({ status: "ready", metrics: {}, warnings: [] }),
    getProject: async () => ({ id: "prj_1", selectedDeviceId: "dev_123" }),
    createGeneration: async () => ({ generationId: "gen_1" }),
    getGeneration: async () => ({ status: "ready" }),
    createJob: async () => ({ jobId: "job_1" }),
    getMe: async () => ({ nickname: "Alice", mobile: "13800000000", profileStatus: "completed" }),
    retryJob: async () => ({ jobId: "job_1" }),
    setSelectedDevice() {}
  });

  stubModule("../miniprogram/utils/page-auth.js", {
    requireAuth() {
      return true;
    }
  });

  stubModule("../miniprogram/utils/status-formatters.js", {
    formatJobStatus(value) {
      return value;
    },
    formatJobStep(value) {
      return value;
    },
    formatDeviceStatus(value) {
      return value;
    },
    formatPreviewStatus(value) {
      return value;
    }
  });

  stubModule("../miniprogram/utils/project-formatters.js", {
    formatProjectType(value) {
      return value;
    },
    formatProjectUpdatedAt(value) {
      return value;
    },
    formatArtifactState(value) {
      return value;
    }
  });
}

function run() {
  clearModules();
  installStubs();
  global.Page = (definition) => definition;

  pageFiles.forEach((relativePath) => {
    const pagePath = path.resolve(__dirname, relativePath);
    assert.doesNotThrow(() => require(pagePath), `${relativePath} should load without module resolution errors`);
  });
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
