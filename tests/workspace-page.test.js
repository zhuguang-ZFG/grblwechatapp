const assert = require("assert");
const path = require("path");

const pagePath = path.resolve(__dirname, "../miniprogram/pages/workspace/index.js");
const apiPath = path.resolve(__dirname, "../miniprogram/services/api/index.js");
const pageAuthPath = path.resolve(__dirname, "../miniprogram/utils/page-auth.js");
const formatterPath = path.resolve(__dirname, "../miniprogram/utils/status-formatters.js");

function loadWorkspacePage({
  selectedDevice = {
    id: "dev_123",
    name: "Old Device Name",
    onlineStatus: "offline"
  },
  projects = [
    { id: "prj_1", name: "Project A", sourceType: "text", selectedDeviceId: "dev_123" },
    { id: "prj_2", name: "Project B", sourceType: "image", selectedDeviceId: "" },
    { id: "prj_3", name: "Project C", sourceType: "text", selectedDeviceId: "dev_missing" }
  ],
  devices = [
    { id: "dev_123", name: "KX Laser A1", onlineStatus: "online" }
  ]
} = {}) {
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
        return selectedDevice;
      },
      async listProjects() {
        return projects;
      },
      async listDevices() {
        return {
          items: devices
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

async function renderWorkspace(options) {
  const pageDefinition = loadWorkspacePage(options);
  const ctx = {
    data: {},
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    }
  };

  await pageDefinition.onShow.call(ctx);
  return ctx.data;
}

async function run() {
  const data = await renderWorkspace();
  assert.strictEqual(data.currentDevice.name, "KX Laser A1");
  assert.strictEqual(data.currentDevice.onlineStatus, "online");
  assert.strictEqual(data.currentDevice.onlineStatusLabel, "status:online");
  assert.strictEqual(data.projects[0].deviceName, "KX Laser A1");
  assert.strictEqual(data.projects[1].deviceName, "待选择设备");
  assert.strictEqual(data.projects[2].deviceName, "dev_missing");

  const emptyStateData = await renderWorkspace({
    selectedDevice: {},
    projects: [],
    devices: []
  });
  assert.deepStrictEqual(emptyStateData.currentDevice, {
    onlineStatusLabel: "未选择设备"
  });

  const staleDeviceData = await renderWorkspace({
    selectedDevice: {
      id: "dev_stale",
      name: "Removed Device",
      onlineStatus: "offline"
    },
    projects: [],
    devices: []
  });
  assert.deepStrictEqual(staleDeviceData.currentDevice, {
    onlineStatusLabel: "未选择设备"
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
