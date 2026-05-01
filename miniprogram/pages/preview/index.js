const api = require("../../services/api");
const pageAuth = require("../../utils/page-auth");
const { formatPreviewStatus } = require("../../utils/status-formatters");

Page({
  data: {
    projectId: "",
    previewId: "",
    preview: {
      status: "processing",
      metrics: {},
      warnings: []
    },
    submitting: false,
    polling: false,
    generationId: ""
  },

  async onLoad(options) {
    if (!pageAuth.requireAuth()) {
      return;
    }
    this.setData({ projectId: options.projectId, previewId: options.previewId });
    await this.refreshPreview();
  },

  onUnload() {
    this._stopPolling();
  },

  _stopPolling() {
    this._pollCount = 0;
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
    }
  },

  async refreshPreview() {
    this.setData({ polling: true });
    try {
      const rawPreview = await api.getPreview(this.data.previewId);
      const preview = {
        ...rawPreview,
        statusLabel: formatPreviewStatus(rawPreview.status)
      };
      // Transform comparison changes object into array with labels
      if (preview.comparison && preview.comparison.changes) {
        const labelMap = { pathCount: "路径数", estimatedDurationSec: "预计时长(秒)", widthMm: "宽度(mm)", heightMm: "高度(mm)" };
        preview.comparison.changes = Object.entries(preview.comparison.changes).map(([key, val]) => ({
          key,
          label: labelMap[key] || key,
          from: val.from,
          to: val.to,
          delta: val.delta
        }));
      }
      this.setData({ preview, polling: false });
      if (preview.status === "processing") {
        this._pollPreview();
      }
    } catch {
      this.setData({ polling: false });
    }
  },

  _pollPreview() {
    this._pollCount = (this._pollCount || 0) + 1;
    if (this._pollCount > 30) {
      this.setData({ polling: false });
      return;
    }
    this._pollTimer = setTimeout(() => {
      this.refreshPreview();
    }, 500);
  },

  backToEditor() {
    this._stopPolling();
    wx.navigateBack();
  },

  async regeneratePreview() {
    this._stopPolling();
    wx.showLoading({ title: "重新生成中..." });
    try {
      const result = await api.createPreview(this.data.projectId);
      this.setData({ previewId: result.previewId, preview: { status: "processing", metrics: {}, warnings: [] } });
      await this.refreshPreview();
    } finally {
      wx.hideLoading();
    }
  },

  async submitJob() {
    this.setData({ submitting: true });
    try {
      let generationId = this.data.generationId;
      if (!generationId) {
        const created = await api.createGeneration(this.data.projectId, this.data.previewId);
        generationId = created.generationId;
        this.setData({ generationId });
        let generation = await api.getGeneration(generationId);
        let pollCount = 0;
        while (generation.status !== "ready" && pollCount < 20) {
          await new Promise((r) => setTimeout(r, 500));
          generation = await api.getGeneration(generationId);
          pollCount++;
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
