const api = require("../../services/api");
const pageAuth = require("../../utils/page-auth");

Page({
  data: {
    query: "",
    results: null,
    searching: false,
    searched: false
  },

  onLoad() {
    if (!pageAuth.requireAuth()) return;
  },

  onQueryInput(event) {
    this.setData({ query: event.detail.value });
  },

  async onSearch() {
    const q = this.data.query.trim();
    if (!q) return;
    this.setData({ searching: true, searched: true });
    try {
      const results = await api.search(q);
      this.setData({ results, searching: false });
    } catch {
      this.setData({ searching: false });
    }
  },

  openProject(event) {
    wx.navigateTo({ url: `/pages/workspace/editor/index?id=${event.currentTarget.dataset.id}` });
  },

  openTemplate(event) {
    wx.navigateTo({ url: `/pages/templates/index` });
  },

  goProjects() {
    wx.navigateTo({ url: "/pages/projects/index" });
  }
});
