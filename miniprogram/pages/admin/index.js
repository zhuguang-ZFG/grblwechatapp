const api = require("../../services/api");
const pageAuth = require("../../utils/page-auth");

Page({
  data: {
    stats: null,
    devices: [],
    jobs: [],
    loading: true,
    statusFilter: "all"
  },

  async onLoad() {
    if (!pageAuth.requireAuth()) return;
    await this.loadData();
  },

  async loadData() {
    this.setData({ loading: true });
    try {
      const [stats, devices, jobsResult] = await Promise.all([
        api.getDashboardStats(),
        api.listDevices(),
        api.listJobs(this.data.statusFilter)
      ]);
      this.setData({
        stats,
        devices: devices.items || [],
        jobs: jobsResult.items || [],
        loading: false
      });
    } catch (e) {
      this.setData({ loading: false });
    }
  },

  onStatusFilterChange(event) {
    const filter = event.currentTarget.dataset.filter;
    this.setData({ statusFilter: filter }, () => {
      this.loadData();
    });
  },

  viewJob(event) {
    wx.navigateTo({ url: `/pages/tasks/detail/index?id=${event.currentTarget.dataset.id}` });
  },

  viewDevice(event) {
    wx.navigateTo({ url: `/pages/devices/bind/index` });
  }
});
