const assert = require("assert");
const path = require("path");

const guardModulePath = path.resolve(__dirname, "../miniprogram/utils/page-auth.js");

function loadGuardWithEnv({ token }) {
  delete require.cache[guardModulePath];

  const storage = {
    authToken: token
  };
  const calls = [];

  global.wx = {
    getStorageSync(key) {
      return storage[key];
    },
    reLaunch(options) {
      calls.push({ type: "reLaunch", options });
    },
    switchTab(options) {
      calls.push({ type: "switchTab", options });
    }
  };

  return {
    calls,
    pageAuth: require(guardModulePath)
  };
}

function run() {
  const unauthenticated = loadGuardWithEnv({ token: "" });
  assert.strictEqual(unauthenticated.pageAuth.requireAuth(), false);
  assert.deepStrictEqual(unauthenticated.calls[0], {
    type: "reLaunch",
    options: {
      url: "/pages/auth/login/index"
    }
  });

  const authenticated = loadGuardWithEnv({ token: "token_123" });
  assert.strictEqual(authenticated.pageAuth.redirectAuthenticatedToHome(), true);
  assert.deepStrictEqual(authenticated.calls[0], {
    type: "switchTab",
    options: {
      url: "/pages/workspace/index"
    }
  });
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
