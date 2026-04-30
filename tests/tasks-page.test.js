const assert = require("assert");
const path = require("path");

const pagePath = path.resolve(__dirname, "../miniprogram/pages/tasks/index.js");
const apiPath = path.resolve(__dirname, "../miniprogram/services/api/index.js");
const pageAuthPath = path.resolve(__dirname, "../miniprogram/utils/page-auth.js");
const formatterPath = path.resolve(__dirname, "../miniprogram/utils/status-formatters.js");

function loadTasksPage() {
  delete require.cache[pagePath];

  let pageDefinition = null;

  global.Page = (definition) => {
    pageDefinition = definition;
  };

  require.cache[apiPath] = {
    id: apiPath,
    filename: apiPath,
    loaded: true,
    exports: {
      async listJobs() {
        return {
          items: [
            {
              id: "job_1",
              projectId: "prj_1",
              deviceId: "dev_123",
              status: "running",
              progress: { currentStep: "running", percent: 65 }
            }
          ]
        };
      },
      async listProjects() {
        return [
          { id: "prj_1", name: "Project A" }
        ];
      },
      async listDevices() {
        return {
          items: [
            { id: "dev_123", name: "KX Laser A1" }
          ]
        };
      }
    }
  };

  require.cache[pageAuthPath] = {
    id: pageAuthPath,
    filename: pageAuthPath,
    loaded: true,
    exports: {
      requireAuth() {
        return true;
      }
    }
  };

  require.cache[formatterPath] = {
    id: formatterPath,
    filename: formatterPath,
    loaded: true,
    exports: {
      formatJobStatus(value) {
        return value;
      },
      formatJobStep(value) {
        return value;
      }
    }
  };

  require(pagePath);
  return pageDefinition;
}

async function run() {
  const pageDefinition = loadTasksPage();
  const ctx = {
    data: {
      filterIndex: 0,
      filterValues: ["all"]
    },
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    }
  };

  await pageDefinition.loadJobs.call(ctx);

  assert.strictEqual(ctx.data.jobs[0].projectName, "Project A");
  assert.strictEqual(ctx.data.jobs[0].deviceName, "KX Laser A1");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
