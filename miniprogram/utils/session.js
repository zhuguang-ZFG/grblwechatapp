const TOKEN_KEY = "authToken";
const USER_KEY = "currentUser";
const PENDING_REGISTRATION_KEY = "pendingRegistration";
const SELECTED_DEVICE_KEY = "selectedDevice";

function getWx() {
  if (typeof wx === "undefined") {
    return null;
  }
  return wx;
}

function getStorageValue(key) {
  const storage = getWx();
  if (!storage) {
    return null;
  }
  return storage.getStorageSync(key) || null;
}

function setStorageValue(key, value) {
  const storage = getWx();
  if (!storage) {
    return value;
  }
  storage.setStorageSync(key, value);
  return value;
}

function removeStorageValue(key) {
  const storage = getWx();
  if (!storage) {
    return;
  }
  storage.removeStorageSync(key);
}

function getAppInstance() {
  if (typeof getApp === "function") {
    return getApp();
  }
  return null;
}

function syncCurrentUser(user) {
  const app = getAppInstance();
  if (app && app.globalData) {
    app.globalData.currentUser = user || null;
  }
}

function saveSession(payload) {
  if (payload.token) {
    setStorageValue(TOKEN_KEY, payload.token);
  }
  if (payload.user) {
    setStorageValue(USER_KEY, payload.user);
    syncCurrentUser(payload.user);
  }
  clearPendingRegistration();
}

function clearSession() {
  removeStorageValue(TOKEN_KEY);
  removeStorageValue(USER_KEY);
  removeStorageValue(SELECTED_DEVICE_KEY);
  syncCurrentUser(null);
}

function isAuthenticated() {
  return Boolean(getStorageValue(TOKEN_KEY));
}

function getCurrentUser() {
  return getStorageValue(USER_KEY);
}

function setPendingRegistration(payload) {
  return setStorageValue(PENDING_REGISTRATION_KEY, payload);
}

function getPendingRegistration() {
  return getStorageValue(PENDING_REGISTRATION_KEY);
}

function clearPendingRegistration() {
  removeStorageValue(PENDING_REGISTRATION_KEY);
}

module.exports = {
  TOKEN_KEY,
  USER_KEY,
  saveSession,
  clearSession,
  isAuthenticated,
  getCurrentUser,
  setPendingRegistration,
  getPendingRegistration,
  clearPendingRegistration
};
