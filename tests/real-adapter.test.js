const assert = require("assert");
const path = require("path");

const requestModulePath = path.resolve(__dirname, "../miniprogram/utils/request.js");
const adapterModulePath = path.resolve(__dirname, "../miniprogram/services/api/real-adapter.js");

let recordedRequests = [];

require.cache[requestModulePath] = {
  id: requestModulePath,
  filename: requestModulePath,
  loaded: true,
  exports: {
    request(options) {
      recordedRequests.push(options);
      if (options.url.startsWith("/projects")) {
        return Promise.resolve({
          items: [
            { id: "prj_1", name: "Mock project" }
          ],
          total: 1
        });
      }
  if (options.url.startsWith("/jobs")) {
        return Promise.resolve({ items: [] });
      }
      if (options.url === "/devices/bind") {
        return Promise.resolve({ deviceId: "dev_124", bindStatus: "bound" });
      }
      if (options.url === "/devices") {
        return Promise.resolve({
          items: [
            { id: "dev_123", name: "KX Laser A1" },
            { id: "dev_124", name: "KX Laser B2" }
          ]
        });
      }
      return Promise.resolve({});
    }
  }
};

delete require.cache[adapterModulePath];
const adapter = require(adapterModulePath);

global.wx = {
  _storage: {},
  setStorageSync(key, value) {
    this._storage[key] = value;
  },
  getStorageSync(key) {
    return this._storage[key];
  }
};

async function run() {
  recordedRequests = [];
  global.wx._storage.pendingRegistration = {
    tempAuthToken: "temp_auth_token_123",
    profile: {
      nickname: "Fresh User"
    }
  };

  global.wx.login = ({ success }) => {
    success({ code: "wx_code_123" });
  };

  await adapter.wechatLogin();
  assert.strictEqual(recordedRequests[0].url, "/auth/wechat-login");
  assert.strictEqual(recordedRequests[0].data.code, "wx_code_123");

  const projects = await adapter.listProjects();
  assert.deepStrictEqual(projects, [{ id: "prj_1", name: "Mock project" }]);
  assert.strictEqual(recordedRequests[1].url, "/projects?page=1&pageSize=20");

  await adapter.register({
    nickname: "Fresh User",
    mobile: "13800000000",
    agreeTerms: true
  });
  assert.strictEqual(recordedRequests[2].url, "/auth/register");
  assert.strictEqual(recordedRequests[2].data.tempAuthToken, "temp_auth_token_123");

  const selected = {
    id: "dev_123",
    name: "KX Laser A1"
  };
  adapter.setSelectedDevice(selected);
  assert.deepStrictEqual(adapter.getSelectedDevice(), selected);

  const bindResult = await adapter.bindDevice("EFGH5678");
  assert.strictEqual(bindResult.bindStatus, "bound");
  assert.deepStrictEqual(global.wx._storage.selectedDevice, {
    id: "dev_124",
    name: "KX Laser B2"
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
