const api = require("../../services/api");
const pageAuth = require("../../utils/page-auth");
const { formatJobStatus, formatJobStep } = require("../../utils/status-formatters");

Page({
  data: {
    filters: ["全部", "排队中", "运行中", "失败", "已完成"],
    filterValues: ["all", "queued", "running", "failed", "completed"],
    filterIndex: 0,
    failureCategoryFilters: ["全部分类", "设备问题", "网关问题", "参数问题", "未知问题"],
    failureCategoryValues: ["all", "DEVICE", "GATEWAY", "PARAMETER", "UNKNOWN"],
    failureCategoryIndex: 0,
    failedCategoryStats: [],
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

  async onFailureCategoryChange(event) {
    this.setData({ failureCategoryIndex: Number(event.detail.value) });
    await this.loadJobs();
  },

  async loadJobs() {
    const filter = this.data.filterValues[this.data.filterIndex];
    const failureCategory = this.data.failureCategoryValues[this.data.failureCategoryIndex];
    const result = await api.listJobs(filter, failureCategory);
    const failedByCategory = (result.summary && result.summary.failedByCategory) || {};
    const failedCategoryStats = this.data.failureCategoryValues
      .filter((value) => value !== "all")
      .map((value, index) => ({
        key: value,
        label: this.data.failureCategoryFilters[index + 1],
        count: failedByCategory[value] || 0
      }))
      .filter((item) => item.count > 0);
    const jobs = result.items.map((item) => ({
      ...item,
      statusLabel: formatJobStatus(item.status),
      stepLabel: formatJobStep(item.progress.currentStep),
      failureCategoryLabel: item.failure && item.failure.category ? this.data.failureCategoryFilters[
        this.data.failureCategoryValues.indexOf(item.failure.category)
      ] || item.failure.category : ""
    }));
    this.setData({
      jobs,
      failedCategoryStats
    });
  },

  openJob(event) {
    wx.navigateTo({ url: `/pages/tasks/detail/index?id=${event.currentTarget.dataset.id}` });
  },

  async retryJob(event) {
    const result = await api.retryJob(event.currentTarget.dataset.id);
    wx.navigateTo({ url: `/pages/tasks/detail/index?id=${result.jobId}` });
  }
});
