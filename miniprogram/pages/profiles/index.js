const api = require("../../services/api");
const pageAuth = require("../../utils/page-auth");

Page({
  data: {
    tab: "machine",
    machineProfiles: [],
    materialProfiles: [],
    loading: true,
    showCreate: false,
    createType: "",
    createName: ""
  },

  async onLoad() {
    if (!pageAuth.requireAuth()) return;
    await this.loadProfiles();
  },

  async loadProfiles() {
    this.setData({ loading: true });
    const [machineResult, materialResult] = await Promise.all([
      api.listMachineProfiles(),
      api.listMaterialProfiles()
    ]);
    this.setData({
      machineProfiles: machineResult.items || [],
      materialProfiles: materialResult.items || [],
      loading: false
    });
  },

  switchTab(event) {
    const tab = event.currentTarget.dataset.tab;
    this.setData({ tab });
  },

  viewProfile(event) {
    const { type, id } = event.currentTarget.dataset;
    if (type === "machine") {
      wx.navigateTo({ url: `/pages/profiles/machine/index?id=${id}` });
    } else {
      wx.navigateTo({ url: `/pages/profiles/material/index?id=${id}` });
    }
  },

  showCreateForm(event) {
    const type = event.currentTarget.dataset.type;
    this.setData({
      showCreate: true,
      createType: type,
      createName: ""
    });
  },

  cancelCreate() {
    this.setData({ showCreate: false, createType: "", createName: "" });
  },

  onCreateNameInput(event) {
    this.setData({ createName: event.detail.value });
  },

  async confirmCreate() {
    const name = this.data.createName.trim();
    if (!name) {
      wx.showToast({ title: "请输入名称", icon: "none" });
      return;
    }
    try {
      if (this.data.createType === "machine") {
        await api.createMachineProfile({ name });
      } else {
        await api.createMaterialProfile({ name });
      }
      wx.showToast({ title: "已创建", icon: "success" });
      this.cancelCreate();
      await this.loadProfiles();
    } catch (e) {
      wx.showToast({ title: "创建失败", icon: "none" });
    }
  },

  async deleteProfile(event) {
    const { type, id } = event.currentTarget.dataset;
    const res = await new Promise((resolve) => {
      wx.showModal({
        title: "删除配置",
        content: "确定要删除此配置吗？此操作不可恢复。",
        success: resolve
      });
    });
    if (!res.confirm) return;
    try {
      if (type === "machine") {
        await api.deleteMachineProfile(id);
      } else {
        await api.deleteMaterialProfile(id);
      }
      wx.showToast({ title: "已删除", icon: "success" });
      await this.loadProfiles();
    } catch (e) {
      wx.showToast({ title: "删除失败", icon: "none" });
    }
  }
});
