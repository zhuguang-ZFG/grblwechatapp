const api = require("../../services/api");
const pageAuth = require("../../utils/page-auth");
const { formatDeviceStatus } = require("../../utils/status-formatters");

Page({
  data: {
    devices: []
  },

  async onShow() {
    if (!pageAuth.requireAuth()) {
      return;
    }
    const result = await api.listDevices();
    const devices = result.items.map((item) => ({
      ...item,
      onlineStatusLabel: formatDeviceStatus(item.onlineStatus)
    }));
    this.setData({ devices });
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
