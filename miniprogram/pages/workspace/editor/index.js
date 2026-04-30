const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");

Page({
  data: {
    id: "",
    loading: false,
    project: {
      name: "",
      sourceType: "text",
      content: { text: "", imageAssetId: null },
      layout: { widthMm: 80, heightMm: 50 },
      processParams: { speed: 1000, power: 65 }
    }
  },

  async onLoad(options) {
    if (!pageAuth.requireAuth()) {
      return;
    }
    const project = await api.getProject(options.id);
    this.setData({ id: options.id, project });
  },

  onNameInput(event) {
    this.setData({ "project.name": event.detail.value });
  },

  onTextInput(event) {
    this.setData({ "project.content.text": event.detail.value });
  },

  onLayoutInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`project.layout.${field}`]: Number(event.detail.value || 0) });
  },

  onParamInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`project.processParams.${field}`]: Number(event.detail.value || 0) });
  },

  setTextMode() {
    this.setData({ "project.sourceType": "text", "project.content.imageAssetId": null });
  },

  setImageMode() {
    this.setData({ "project.sourceType": "image", "project.content.text": "" });
  },

  mockUploadImage() {
    this.setData({ "project.content.imageAssetId": "ast_mock_001" });
  },

  async saveProject() {
    const project = await api.saveProject(this.data.id, this.data.project);
    this.setData({ project });
    wx.showToast({ title: "已保存", icon: "success" });
  },

  async generatePreview() {
    this.setData({ loading: true });
    try {
      await api.saveProject(this.data.id, this.data.project);
      const result = await api.createPreview(this.data.id);
      wx.navigateTo({ url: `/pages/preview/index?projectId=${this.data.id}&previewId=${result.previewId}` });
    } finally {
      this.setData({ loading: false });
    }
  }
});
