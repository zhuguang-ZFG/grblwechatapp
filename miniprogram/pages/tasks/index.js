const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");
const { formatJobStatus, formatJobStep } = require("../../../utils/status-formatters");

Page({
  data: {
    filters: ["全部", "排队中", "运行中", "失败", "已完成"],
    filterValues: ["all", "queued", "running", "failed", "completed"],
    filterIndex: 0,
    jobs: []
  },

  async onShow() {
    if (!pageAuth.requireAuth()) {
      return;
    }
    await this.loadJobs();
  },

  async onFilterChange(event) {
    this.setData({ filterIndex: Number(event.detail.value) });
    await this.loadJobs();
  },

  async loadJobs() {
    const filter = this.data.filterValues[this.data.filterIndex];
    const result = await api.listJobs(filter);
    const jobs = result.items.map((item) => ({
      ...item,
      statusLabel: formatJobStatus(item.status),
      stepLabel: formatJobStep(item.progress.currentStep)
    }));
    this.setData({ jobs });
  },

  openJob(event) {
    wx.navigateTo({ url: `/pages/tasks/detail/index?id=${event.currentTarget.dataset.id}` });
  },

  async retryJob(event) {
    const result = await api.retryJob(event.currentTarget.dataset.id);
    wx.navigateTo({ url: `/pages/tasks/detail/index?id=${result.jobId}` });
  }
});
