const assert = require("assert");
const path = require("path");

const envModulePath = path.resolve(__dirname, "../miniprogram/config/env.js");
const requestModulePath = path.resolve(__dirname, "../miniprogram/utils/request.js");

function loadRequestModule() {
  delete require.cache[requestModulePath];
  return require(requestModulePath);
}

async function run() {
  const captured = [];

  require.cache[envModulePath] = {
    id: envModulePath,
    filename: envModulePath,
    loaded: true,
    exports: {
      apiBaseUrl: "https://api.example.test/api/v1"
    }
  };

  global.wx = {
    getStorageSync(key) {
      if (key === "authToken") {
        return "live_token_123";
      }
      return undefined;
    },
    request(options) {
      captured.push(options);
      options.success({
        statusCode: 200,
        data: {
          ok: true
        }
      });
    }
  };

  const { request } = loadRequestModule();
  const response = await request({
    url: "/devices",
    method: "GET"
  });

  assert.deepStrictEqual(response, { ok: true });
  assert.strictEqual(captured[0].url, "https://api.example.test/api/v1/devices");
  assert.strictEqual(captured[0].header.Authorization, "Bearer live_token_123");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
