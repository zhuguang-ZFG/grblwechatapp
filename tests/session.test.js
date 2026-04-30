const assert = require("assert");
const path = require("path");

const sessionModulePath = path.resolve(__dirname, "../miniprogram/utils/session.js");

function loadSessionWithStorage(storage) {
  delete require.cache[sessionModulePath];
  global.wx = {
    getStorageSync(key) {
      return storage[key];
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    removeStorageSync(key) {
      delete storage[key];
    }
  };
  return require(sessionModulePath);
}

function run() {
  const storage = {};
  const session = loadSessionWithStorage(storage);

  assert.strictEqual(session.isAuthenticated(), false);
  assert.deepStrictEqual(session.getCurrentUser(), null);
  assert.deepStrictEqual(session.getPendingRegistration(), null);

  session.setPendingRegistration({
    tempAuthToken: "temp_auth_token",
    profile: {
      nickname: "Fresh User"
    }
  });
  assert.deepStrictEqual(session.getPendingRegistration(), {
    tempAuthToken: "temp_auth_token",
    profile: {
      nickname: "Fresh User"
    }
  });

  session.saveSession({
    token: "live_token",
    user: {
      id: "usr_1",
      nickname: "Alice"
    }
  });

  assert.strictEqual(session.isAuthenticated(), true);
  assert.deepStrictEqual(session.getCurrentUser(), {
    id: "usr_1",
    nickname: "Alice"
  });
  assert.deepStrictEqual(session.getPendingRegistration(), null);

  session.clearSession();
  assert.strictEqual(session.isAuthenticated(), false);
  assert.deepStrictEqual(session.getCurrentUser(), null);
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
