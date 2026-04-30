const assert = require("assert");
const path = require("path");

const pagePath = path.resolve(__dirname, "../miniprogram/pages/tasks/index.js");
const apiPath = path.resolve(__dirname, "../miniprogram/services/api/index.js");
const pageAuthPath = path.resolve(__dirname, "../miniprogram/utils/page-auth.js");
const formatterPath = path.resolve(__dirname, "../miniprogram/utils/status-formatters.js");

function loadTasksPage() {
  delete require.cache[pagePath];

  let pageDefinition = null;
  const calls = {
    listJobsArgs: []
  };

  global.Page = (definition) => {
    pageDefinition = definition;
  };

  global.wx = {
    navigateTo() {}
  };

  require.cache[apiPath] = {
    id: apiPath,
    filename: apiPath,
    loaded: true,
    exports: {
      async listJobs(status, failureCategory) {
        calls.listJobsArgs.push([status, failureCategory]);
        return {
          items: [
            {
              id: "job_1",
              projectId: "prj_1",
              deviceId: "dev_123",
              status: "failed",
              progress: { currentStep: "dispatching", percent: 12 },
              failure: {
                code: "DEVICE_OFFLINE",
                category: "DEVICE"
              }
            }
          ],
          summary: {
            totalFailed: 1,
            failedByCategory: {
              DEVICE: 1
            }
          }
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
  return { pageDefinition, calls };
}

async function run() {
  const { pageDefinition, calls } = loadTasksPage();
  const ctx = {
    data: {
      filters: ["全部", "排队中", "运行中", "失败", "已完成"],
      filterValues: ["all", "queued", "running", "failed", "completed"],
      filterIndex: 3,
      failureCategoryFilters: ["全部分类", "设备问题", "网关问题", "参数问题", "未知问题"],
      failureCategoryValues: ["all", "DEVICE", "GATEWAY", "PARAMETER", "UNKNOWN"],
      failureCategoryIndex: 1,
      jobs: [],
      failedCategoryStats: []
    },
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    }
  };

  await pageDefinition.loadJobs.call(ctx);

  assert.deepStrictEqual(calls.listJobsArgs[0], ["failed", "DEVICE"]);
  assert.strictEqual(ctx.data.jobs[0].projectName, "Project A");
  assert.strictEqual(ctx.data.jobs[0].deviceName, "KX Laser A1");
  assert.strictEqual(ctx.data.jobs[0].failureCategoryLabel, "设备问题");
  assert.strictEqual(ctx.data.failedCategoryStats[0].label, "设备问题");
  assert.strictEqual(ctx.data.failedCategoryStats[0].count, 1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
