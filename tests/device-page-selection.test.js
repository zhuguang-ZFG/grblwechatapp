const assert = require("assert");
const path = require("path");

const pagePath = path.resolve(__dirname, "../miniprogram/pages/devices/index.js");
const apiPath = path.resolve(__dirname, "../miniprogram/services/api/index.js");
const pageAuthPath = path.resolve(__dirname, "../miniprogram/utils/page-auth.js");
const formatterPath = path.resolve(__dirname, "../miniprogram/utils/status-formatters.js");

function loadDevicesPage() {
  delete require.cache[pagePath];

  let pageDefinition = null;
  const calls = {
    selectedDevice: null,
    toastTitle: ""
  };

  global.Page = (definition) => {
    pageDefinition = definition;
  };

  global.wx = {
    showToast(options) {
      calls.toastTitle = options.title;
    }
  };

  require.cache[apiPath] = {
    id: apiPath,
    filename: apiPath,
    loaded: true,
    exports: {
      async listDevices() {
        return {
          items: [
            {
              id: "dev_123",
              name: "KX Laser A1",
              onlineStatus: "online",
              model: "esp32_grbl",
              lastSeenAt: "2026-05-01T10:08:00Z"
            },
            {
              id: "dev_124",
              name: "KX Laser B2",
              onlineStatus: "offline",
              model: "esp32_grbl",
              lastSeenAt: "2026-05-01T09:00:00Z"
            }
          ]
        };
      },
      getSelectedDevice() {
        return { id: "dev_123" };
      },
      setSelectedDevice(device) {
        calls.selectedDevice = device;
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
        return value;
      },
      formatDateTime(value) {
        return value.replace("T", " ").replace("Z", "");
      }
    }
  };

  require(pagePath);

  return { pageDefinition, calls };
}

async function run() {
  const { pageDefinition, calls } = loadDevicesPage();
  const ctx = {
    data: {
      devices: []
    },
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    }
  };

  await pageDefinition.onShow.call(ctx);
  assert.strictEqual(ctx.data.devices[0].isSelected, true);
  assert.strictEqual(ctx.data.devices[0].selectedLabel, "当前设备");
  assert.strictEqual(ctx.data.devices[0].lastSeenLabel, "2026-05-01 10:08:00");
  assert.strictEqual(ctx.data.devices[1].isSelected, false);

  pageDefinition.selectDevice.call(ctx, {
    currentTarget: {
      dataset: {
        id: "dev_123"
      }
    }
  });

  assert.deepStrictEqual(calls.selectedDevice, {
    id: "dev_123",
    name: "KX Laser A1",
    onlineStatus: "online",
    model: "esp32_grbl",
    lastSeenAt: "2026-05-01T10:08:00Z",
    onlineStatusLabel: "online",
    lastSeenLabel: "2026-05-01 10:08:00",
    isSelected: true,
    selectedLabel: "当前设备"
  });
  assert.strictEqual(calls.toastTitle, "已切换设备");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
