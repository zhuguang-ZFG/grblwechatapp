const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");

Page({
  data: {
    profile: null,
    loading: true
  },

  async onLoad(options) {
    if (!pageAuth.requireAuth()) {
      return;
    }
    if (!options.id) {
      this.setData({ loading: false });
      return;
    }
    const profile = await api.getMachineProfile(options.id);
    this.setData({ profile, loading: false });
  }
});
