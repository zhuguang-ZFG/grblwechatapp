const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");
const { formatPreviewStatus } = require("../../../utils/status-formatters");

Page({
  data: {
    projectId: "",
    previewId: "",
    preview: {
      status: "processing",
      metrics: {},
      warnings: []
    },
    submitting: false
  },

  async onLoad(options) {
    if (!pageAuth.requireAuth()) {
      return;
    }
    this.setData({ projectId: options.projectId, previewId: options.previewId });
    await this.refreshPreview();
  },

  async refreshPreview() {
    const rawPreview = await api.getPreview(this.data.previewId);
    const preview = {
      ...rawPreview,
      statusLabel: formatPreviewStatus(rawPreview.status)
    };
    this.setData({ preview });
    if (preview.status === "processing") {
      setTimeout(() => this.refreshPreview(), 500);
    }
  },

  backToEditor() {
    wx.navigateBack();
  },

  async submitJob() {
    this.setData({ submitting: true });
    try {
      let generationId = this.data.generationId;
      if (!generationId) {
        const created = await api.createGeneration(this.data.projectId, this.data.previewId);
        generationId = created.generationId;
        let generation = await api.getGeneration(generationId);
        if (generation.status !== "ready") {
          generation = await api.getGeneration(generationId);
        }
      }
      const project = await api.getProject(this.data.projectId);
      const job = await api.createJob({
        projectId: this.data.projectId,
        generationId,
        deviceId: project.selectedDeviceId
      });
      wx.navigateTo({ url: `/pages/tasks/detail/index?id=${job.jobId}` });
    } finally {
      this.setData({ submitting: false });
    }
  }
});
