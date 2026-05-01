const api = require("../../services/api");
const pageAuth = require("../../utils/page-auth");
const { formatJobStatus, formatJobStep, formatDateTime } = require("../../utils/status-formatters");

const FAILURE_CATEGORY_LABELS = {
  DEVICE: "设备问题",
  GATEWAY: "网关问题",
  PARAMETER: "参数问题",
  UNKNOWN: "未知问题"
};

function getFailureCategoryLabel(category) {
  if (!category) {
    return "";
  }
  return FAILURE_CATEGORY_LABELS[category] || category;
}

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

  formatTime(isoString) {
    return formatDateTime(isoString);
  },

  async loadJobs() {
    try {
      const filter = this.data.filterValues[this.data.filterIndex];
      const failureCategory = this.data.failureCategoryValues[this.data.failureCategoryIndex];
      const result = await api.listJobs(filter, failureCategory);
      const [projects, devices] = await Promise.all([
        api.listProjects(),
        api.listDevices()
      ]);
      const projectMap = Object.fromEntries((projects || []).map((item) => [item.id, item.name]));
      const deviceMap = Object.fromEntries(((devices && devices.items) || []).map((item) => [item.id, item.name]));
      const failedByCategory = (result.summary && result.summary.failedByCategory) || {};
      const failedCategoryStats = this.data.failureCategoryValues
        .filter((value) => value !== "all")
        .map((value) => ({
          key: value,
          label: getFailureCategoryLabel(value),
          count: failedByCategory[value] || 0
        }))
        .filter((item) => item.count > 0);

      const jobs = result.items.map((item) => ({
        ...item,
        projectName: projectMap[item.projectId] || item.projectId,
        deviceName: deviceMap[item.deviceId] || item.deviceId,
        statusLabel: formatJobStatus(item.status),
        stepLabel: formatJobStep(item.progress.currentStep),
        failureCategoryLabel: getFailureCategoryLabel(item.failure && item.failure.category)
      }));

      this.setData({
        jobs,
        failedCategoryStats,
        lastRefreshedAt: new Date().toISOString()
      });
    } catch (error) {
      wx.showToast({ title: "加载任务列表失败", icon: "none" });
    }
  },

  openJob(event) {
    wx.navigateTo({ url: `/pages/tasks/detail/index?id=${event.currentTarget.dataset.id}` });
  },

  async retryJob(event) {
    try {
      const result = await api.retryJob(event.currentTarget.dataset.id);
      wx.navigateTo({ url: `/pages/tasks/detail/index?id=${result.jobId}` });
    } catch (error) {
      wx.showToast({ title: "重试失败", icon: "none" });
    }
  }
});
