const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");
const session = require("../../../utils/session");

Page({
  data: {
    user: {}
  },

  async onShow() {
    if (!pageAuth.requireAuth()) {
      return;
    }
    const user = await api.getMe();
    this.setData({ user });
  },

  goProjects() {
    wx.navigateTo({ url: "/pages/projects/index" });
  },

  logout() {
    session.clearSession();
    wx.reLaunch({ url: "/pages/auth/login/index" });
  }
});
