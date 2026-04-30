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
  let shouldFail = false;

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
      if (shouldFail) {
        options.success({
          statusCode: 409,
          data: {
            code: "invalid_retry_target",
            message: "Only retryable failed jobs can be retried"
          }
        });
        return;
      }
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

  shouldFail = true;
  await assert.rejects(
    () =>
      request({
        url: "/jobs/job_x/retry",
        method: "POST"
      }),
    (error) => {
      assert.strictEqual(error.message, "Only retryable failed jobs can be retried");
      assert.strictEqual(error.code, "invalid_retry_target");
      assert.strictEqual(error.statusCode, 409);
      return true;
    }
  );
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
