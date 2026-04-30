const assert = require("assert");
const path = require("path");

const pagePath = path.resolve(__dirname, "../miniprogram/pages/projects/index.js");
const apiPath = path.resolve(__dirname, "../miniprogram/services/api/index.js");
const pageAuthPath = path.resolve(__dirname, "../miniprogram/utils/page-auth.js");
const formatterPath = path.resolve(__dirname, "../miniprogram/utils/project-formatters.js");

function loadProjectsPage() {
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
      async listProjects() {
        return [
          {
            id: "prj_1",
            name: "Project A",
            sourceType: "text",
            selectedDeviceId: "dev_123",
            latestPreviewId: "pre_1",
            latestGenerationId: "",
            updatedAt: "2026-05-01T10:05:00Z"
          }
        ];
      },
      async listDevices() {
        return {
          items: [
            {
              id: "dev_123",
              name: "KX Laser A1",
              onlineStatus: "online"
            }
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
      formatProjectType(value) {
        return value;
      },
      formatProjectUpdatedAt(value) {
        return value;
      },
      formatArtifactState(value) {
        return value ? "已生成" : "未生成";
      }
    }
  };

  require(pagePath);
  return pageDefinition;
}

async function run() {
  const pageDefinition = loadProjectsPage();
  const ctx = {
    data: {
      filterIndex: 0,
      filterValues: ["all"]
    },
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    }
  };

  await pageDefinition.loadProjects.call(ctx);

  assert.strictEqual(ctx.data.projects[0].deviceName, "KX Laser A1");
  assert.strictEqual(ctx.data.projects[0].deviceStatusLabel, "在线");
  assert.strictEqual(ctx.data.projects[0].previewStateLabel, "已生成");
  assert.strictEqual(ctx.data.projects[0].generationStateLabel, "未生成");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
