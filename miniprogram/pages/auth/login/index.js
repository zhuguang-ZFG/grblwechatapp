const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");
const session = require("../../../utils/session");

Page({
  data: {
    mode: "existing",
    loading: false
  },

  onShow() {
    pageAuth.redirectAuthenticatedToHome();
  },

  onModeChange(event) {
    this.setData({ mode: event.detail.value });
  },

  async handleLogin() {
    this.setData({ loading: true });
    try {
      const result = await api.wechatLogin(this.data.mode);
      if (result.nextAction === "register") {
        session.clearSession();
        session.setPendingRegistration({
          tempAuthToken: result.tempAuthToken || "",
          profile: result.profile || {}
        });
        wx.navigateTo({ url: "/pages/auth/register/index" });
      } else if (result.nextAction === "complete_profile") {
        session.saveSession({
          token: result.token,
          user: result.user
        });
        wx.navigateTo({ url: "/pages/auth/complete-profile/index" });
      } else {
        session.saveSession({
          token: result.token,
          user: result.user
        });
        wx.switchTab({ url: "/pages/workspace/index" });
      }
    } finally {
      this.setData({ loading: false });
    }
  }
});
