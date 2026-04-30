const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");
const session = require("../../../utils/session");

Page({
  data: {
    loading: false,
    form: {
      nickname: "",
      mobile: "",
      agreeTerms: false
    }
  },

  onShow() {
    if (pageAuth.redirectAuthenticatedToHome()) {
      return;
    }
    const pendingRegistration = session.getPendingRegistration();
    if (!pendingRegistration) {
      wx.reLaunch({ url: "/pages/auth/login/index" });
      return;
    }
    const nickname = pendingRegistration.profile && pendingRegistration.profile.nickname;
    if (nickname && !this.data.form.nickname) {
      this.setData({ "form.nickname": nickname });
    }
  },

  onNicknameInput(event) {
    this.setData({ "form.nickname": event.detail.value });
  },

  onMobileInput(event) {
    this.setData({ "form.mobile": event.detail.value });
  },

  toggleTerms() {
    this.setData({ "form.agreeTerms": !this.data.form.agreeTerms });
  },

  async submit() {
    const { nickname, mobile, agreeTerms } = this.data.form;
    if (!nickname || !mobile || !agreeTerms) {
      wx.showToast({ title: "请先补全注册信息", icon: "none" });
      return;
    }
    this.setData({ loading: true });
    try {
      const result = await api.register(this.data.form);
      session.saveSession({
        token: result.token,
        user: result.user
      });
      wx.switchTab({ url: "/pages/workspace/index" });
    } finally {
      this.setData({ loading: false });
    }
  }
});
