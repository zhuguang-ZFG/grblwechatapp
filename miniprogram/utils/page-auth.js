const session = require("./session");

function requireAuth() {
  if (session.isAuthenticated()) {
    return true;
  }
  wx.reLaunch({
    url: "/pages/auth/login/index"
  });
  return false;
}

function redirectAuthenticatedToHome() {
  if (!session.isAuthenticated()) {
    return false;
  }
  wx.switchTab({
    url: "/pages/workspace/index"
  });
  return true;
}

module.exports = {
  requireAuth,
  redirectAuthenticatedToHome
};
