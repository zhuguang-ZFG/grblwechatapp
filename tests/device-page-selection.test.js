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
            { id: "dev_123", name: "KX Laser A1", onlineStatus: "online", model: "esp32_grbl" }
          ]
        };
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
      devices: [
        { id: "dev_123", name: "KX Laser A1", onlineStatus: "online", model: "esp32_grbl" }
      ]
    },
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    }
  };

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
    model: "esp32_grbl"
  });
  assert.strictEqual(calls.toastTitle, "已切换设备");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
