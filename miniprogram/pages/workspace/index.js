const api = require("../../services/api");
const pageAuth = require("../../utils/page-auth");
const { formatDeviceStatus } = require("../../utils/status-formatters");

Page({
  data: {
    currentDevice: {},
    projects: []
  },

  async onShow() {
    if (!pageAuth.requireAuth()) {
      return;
    }
    try {
      const rawDevice = api.getSelectedDevice() || {};
      const [allProjects, devices] = await Promise.all([
        api.listProjects(),
        api.listDevices()
      ]);
      const deviceMap = Object.fromEntries((devices.items || []).map((item) => [item.id, item]));
      const currentDeviceSource = (rawDevice.id && deviceMap[rawDevice.id]) || rawDevice;
      const currentDevice = currentDeviceSource.id
        ? {
          ...currentDeviceSource,
          onlineStatusLabel: formatDeviceStatus(currentDeviceSource.onlineStatus) || "离线"
        }
        : {
          onlineStatusLabel: "未选择设备"
        };
      const projects = allProjects.slice(0, 3).map((item) => ({
        ...item,
        deviceName: item.selectedDeviceId
          ? ((deviceMap[item.selectedDeviceId] && deviceMap[item.selectedDeviceId].name) || item.selectedDeviceId)
          : "待选择设备"
      }));
      this.setData({ currentDevice, projects });
    } catch (error) {
      wx.showToast({ title: "加载工作台数据失败", icon: "none" });
    }
  },

  async createProject(event) {
    const sourceType = event.currentTarget.dataset.sourceType;
    try {
      const selectedDevice = api.getSelectedDevice();
      const result = await api.createProject(sourceType, selectedDevice && selectedDevice.id);
      wx.navigateTo({ url: `/pages/workspace/editor/index?id=${result.id}` });
    } catch (error) {
      wx.showToast({ title: "创建项目失败", icon: "none" });
    }
  },

  openProject(event) {
    wx.navigateTo({ url: `/pages/workspace/editor/index?id=${event.currentTarget.dataset.id}` });
  },

  goDevices() {
    wx.switchTab({ url: "/pages/devices/index" });
  },

  goProjects() {
    wx.navigateTo({ url: "/pages/projects/index" });
  },

  goTemplates() {
    wx.navigateTo({ url: "/pages/templates/index" });
  },

  goProfiles() {
    wx.navigateTo({ url: "/pages/profiles/index" });
  },

  goAdmin() {
    wx.navigateTo({ url: "/pages/admin/index" });
  },

  goSearch() {
    wx.navigateTo({ url: "/pages/search/index" });
  }
});
