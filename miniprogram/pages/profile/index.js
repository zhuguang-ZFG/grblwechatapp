const api = require("../../services/api");
const pageAuth = require("../../utils/page-auth");
const session = require("../../utils/session");

Page({
  data: {
    user: {}
  },

  async onShow() {
    if (!pageAuth.requireAuth()) {
      return;
    }
    try {
      const user = await api.getMe();
      this.setData({ user });
    } catch (error) {
      wx.showToast({ title: "加载个人信息失败", icon: "none" });
    }
  },

  goProjects() {
    wx.navigateTo({ url: "/pages/projects/index" });
  },

  goHelpCenter() {
    wx.navigateTo({ url: "/pages/help/index" });
  },

  logout() {
    session.clearSession();
    wx.reLaunch({ url: "/pages/auth/login/index" });
  }
});
