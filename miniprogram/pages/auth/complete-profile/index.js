const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");
const session = require("../../../utils/session");

Page({
  data: {
    loading: false,
    form: {
      nickname: "",
      mobile: ""
    }
  },

  onShow() {
    if (!pageAuth.requireAuth()) {
      return;
    }
    const currentUser = session.getCurrentUser() || {};
    this.setData({
      "form.nickname": currentUser.nickname || "",
      "form.mobile": currentUser.mobile || ""
    });
  },

  onNicknameInput(event) {
    this.setData({ "form.nickname": event.detail.value });
  },

  onMobileInput(event) {
    this.setData({ "form.mobile": event.detail.value });
  },

  async submit() {
    if (!this.data.form.nickname || !this.data.form.mobile) {
      wx.showToast({ title: "请先补全信息", icon: "none" });
      return;
    }
    this.setData({ loading: true });
    try {
      const result = await api.completeProfile(this.data.form);
      session.saveSession({
        token: wx.getStorageSync(session.TOKEN_KEY),
        user: result.user
      });
      wx.switchTab({ url: "/pages/workspace/index" });
    } finally {
      this.setData({ loading: false });
    }
  }
});
