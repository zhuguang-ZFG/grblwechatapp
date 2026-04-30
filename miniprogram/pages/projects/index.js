const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");
const {
  formatProjectType,
  formatProjectUpdatedAt,
  formatArtifactState
} = require("../../../utils/project-formatters");

Page({
  data: {
    filters: ["全部", "文字", "图片"],
    filterValues: ["all", "text", "image"],
    filterIndex: 0,
    projects: []
  },

  async onShow() {
    if (!pageAuth.requireAuth()) {
      return;
    }
    await this.loadProjects();
  },

  async onFilterChange(event) {
    this.setData({ filterIndex: Number(event.detail.value) });
    await this.loadProjects();
  },

  async loadProjects() {
    const filter = this.data.filterValues[this.data.filterIndex];
    const allProjects = await api.listProjects();
    const filtered = filter === "all"
      ? allProjects
      : allProjects.filter((item) => item.sourceType === filter);

    const devices = await api.listDevices();
    const deviceMap = Object.fromEntries(devices.items.map((item) => [item.id, item.name]));

    const projects = filtered.map((item) => ({
      ...item,
      sourceTypeLabel: formatProjectType(item.sourceType),
      updatedAtLabel: formatProjectUpdatedAt(item.updatedAt),
      previewStateLabel: formatArtifactState(item.latestPreviewId),
      generationStateLabel: formatArtifactState(item.latestGenerationId),
      deviceName: deviceMap[item.selectedDeviceId] || item.selectedDeviceId || "未选择设备"
    }));

    this.setData({ projects });
  },

  openProject(event) {
    wx.navigateTo({ url: `/pages/workspace/editor/index?id=${event.currentTarget.dataset.id}` });
  },

  async createTextProject() {
    const result = await api.createProject("text");
    wx.navigateTo({ url: `/pages/workspace/editor/index?id=${result.id}` });
  },

  async createImageProject() {
    const result = await api.createProject("image");
    wx.navigateTo({ url: `/pages/workspace/editor/index?id=${result.id}` });
  }
});
