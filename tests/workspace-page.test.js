const assert = require("assert");
const path = require("path");

const pagePath = path.resolve(__dirname, "../miniprogram/pages/workspace/index.js");
const apiPath = path.resolve(__dirname, "../miniprogram/services/api/index.js");
const pageAuthPath = path.resolve(__dirname, "../miniprogram/utils/page-auth.js");
const formatterPath = path.resolve(__dirname, "../miniprogram/utils/status-formatters.js");

function loadWorkspacePage() {
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
      getSelectedDevice() {
        return {
          id: "dev_123",
          name: "Old Device Name",
          onlineStatus: "offline"
        };
      },
      async listProjects() {
        return [
          { id: "prj_1", name: "Project A", sourceType: "text", selectedDeviceId: "dev_123" },
          { id: "prj_2", name: "Project B", sourceType: "image", selectedDeviceId: "" },
          { id: "prj_3", name: "Project C", sourceType: "text", selectedDeviceId: "dev_missing" }
        ];
      },
      async listDevices() {
        return {
          items: [
            { id: "dev_123", name: "KX Laser A1", onlineStatus: "online" }
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
      formatDeviceStatus(value) {
        return value ? `status:${value}` : "";
      }
    }
  };

  require(pagePath);
  return pageDefinition;
}

async function run() {
  const pageDefinition = loadWorkspacePage();
  const ctx = {
    data: {},
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    }
  };

  await pageDefinition.onShow.call(ctx);

  assert.strictEqual(ctx.data.currentDevice.name, "KX Laser A1");
  assert.strictEqual(ctx.data.currentDevice.onlineStatus, "online");
  assert.strictEqual(ctx.data.currentDevice.onlineStatusLabel, "status:online");
  assert.strictEqual(ctx.data.projects[0].deviceName, "KX Laser A1");
  assert.strictEqual(ctx.data.projects[1].deviceName, "待选择设备");
  assert.strictEqual(ctx.data.projects[2].deviceName, "dev_missing");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
