const api = require("../../services/api");
const pageAuth = require("../../utils/page-auth");
const { formatDeviceStatus, formatDateTime } = require("../../utils/status-formatters");

Page({
  data: {
    devices: []
  },

  async onShow() {
    if (!pageAuth.requireAuth()) {
      return;
    }
    try {
      const selectedDevice = api.getSelectedDevice ? api.getSelectedDevice() || {} : {};
      const result = await api.listDevices();
      const devices = result.items.map((item) => ({
        ...item,
        onlineStatusLabel: formatDeviceStatus(item.onlineStatus),
        lastSeenLabel: formatDateTime(item.lastSeenAt),
        isSelected: item.id === selectedDevice.id,
        selectedLabel: item.id === selectedDevice.id ? "当前设备" : ""
      }));
      this.setData({ devices });
    } catch (error) {
      wx.showToast({ title: "加载设备列表失败", icon: "none" });
    }
  },

  selectDevice(event) {
    const device = this.data.devices.find((item) => item.id === event.currentTarget.dataset.id);
    if (!device) {
      return;
    }
    api.setSelectedDevice(device);
    wx.showToast({ title: "已切换设备", icon: "success" });
  },

  goBindDevice() {
    wx.navigateTo({ url: "/pages/devices/bind/index" });
  }
});
