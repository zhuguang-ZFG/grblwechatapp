const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");
const { formatDeviceStatus } = require("../../../utils/status-formatters");

Page({
  data: {
    currentDevice: {},
    projects: []
  },

  async onShow() {
    if (!pageAuth.requireAuth()) {
      return;
    }
    const rawDevice = api.getSelectedDevice();
    const currentDevice = {
      ...rawDevice,
      onlineStatusLabel: formatDeviceStatus(rawDevice.onlineStatus)
    };
    const allProjects = await api.listProjects();
    const projects = allProjects.slice(0, 3);
    this.setData({ currentDevice, projects });
  },

  async createTextProject() {
    const result = await api.createProject("text");
    wx.navigateTo({ url: `/pages/workspace/editor/index?id=${result.id}` });
  },

  async createImageProject() {
    const result = await api.createProject("image");
    wx.navigateTo({ url: `/pages/workspace/editor/index?id=${result.id}` });
  },

  openProject(event) {
    wx.navigateTo({ url: `/pages/workspace/editor/index?id=${event.currentTarget.dataset.id}` });
  },

  goDevices() {
    wx.switchTab({ url: "/pages/devices/index" });
  },

  goProjects() {
    wx.navigateTo({ url: "/pages/projects/index" });
  }
});
