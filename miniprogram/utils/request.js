const env = require("../config/env");

function getAuthToken() {
  if (typeof wx === "undefined" || !wx.getStorageSync) {
    return "";
  }
  return wx.getStorageSync("authToken") || "";
}

function request(options) {
  return new Promise((resolve, reject) => {
    const token = options.skipAuth ? "" : getAuthToken();
    const header = Object.assign(
      {
        "Content-Type": "application/json"
      },
      token ? { Authorization: `Bearer ${token}` } : {},
      options.header || {}
    );

    wx.request({
      url: `${env.apiBaseUrl}${options.url}`,
      method: options.method || "GET",
      data: options.data,
      header,
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
          return;
        }
        const message = response.data && (response.data.message || response.data.error);
        reject(new Error(message || `Request failed: ${response.statusCode}`));
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

module.exports = {
  request
};
