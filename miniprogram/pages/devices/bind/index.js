const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");

Page({
  data: {
    bindingCode: "",
    loading: false
  },

  onShow() {
    pageAuth.requireAuth();
  },

  onBindingCodeInput(event) {
    this.setData({ bindingCode: event.detail.value });
  },

  async submit() {
    if (!this.data.bindingCode) {
      wx.showToast({ title: "请输入绑定码", icon: "none" });
      return;
    }
    this.setData({ loading: true });
    try {
      await api.bindDevice(this.data.bindingCode);
      wx.navigateBack();
    } finally {
      this.setData({ loading: false });
    }
  }
});
