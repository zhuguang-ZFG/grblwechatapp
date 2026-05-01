const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");
const { formatDeviceStatus } = require("../../../utils/status-formatters");

Page({
  data: {
    id: "",
    loading: false,
    dirty: false,
    device: {},
    machineProfileOptions: [],
    materialProfileOptions: [],
    machineProfileIndex: 0,
    materialProfileIndex: 0,
    fontOptions: [],
    fontIndex: 0,
    processorOptions: [],
    processorIndex: 0,
    project: {
      name: "",
      sourceType: "text",
      content: { text: "", imageAssetId: null, fontId: "fnt_001", fontSize: 100, lineGap: 0, processorPresetId: null },
      layout: { widthMm: 80, heightMm: 50, rotationDeg: 0, align: "center" },
      processParams: { speed: 1000, power: 65, passes: 1, lineSpacing: 1.2 }
    }
  },

  async onLoad(options) {
    if (!pageAuth.requireAuth()) {
      return;
    }
    this.setData({ id: options.id });
    await Promise.all([
      this.loadProject(),
      this.loadDevice(),
      this.loadProfiles()
    ]);
  },

  async onShow() {
    if (!this.data.id) {
      return;
    }
    await this.loadDevice();
  },

  async loadProject() {
    const project = await api.getProject(this.data.id);
    this.setData({ project });
  },

  async loadDevice() {
    const device = await api.getSelectedDevice();
    const deviceInfo = device
      ? { ...device, onlineStatusLabel: formatDeviceStatus(device.onlineStatus) }
      : {};
    this.setData({ device: deviceInfo });
  },

  async loadProfiles() {
    const [machineResult, materialResult, fontResult, processorResult] = await Promise.all([
      api.listMachineProfiles(),
      api.listMaterialProfiles(),
      api.listFonts(),
      api.listImageProcessors()
    ]);
    const machineOptions = (machineResult.items || []).map((item) => ({
      id: item.id,
      name: item.name
    }));
    const materialOptions = (materialResult.items || []).map((item) => ({
      id: item.id,
      name: item.name
    }));
    const fontOptions = (fontResult.items || []).map((item) => ({
      id: item.id,
      name: item.name
    }));
    const processorOptions = (processorResult.items || []).map((item) => ({
      id: item.id,
      name: item.name
    }));
    const machineIndex = Math.max(0, machineOptions.findIndex((o) => o.id === this.data.project.machineProfileId));
    const materialIndex = Math.max(0, materialOptions.findIndex((o) => o.id === this.data.project.materialProfileId));
    const fontIndex = Math.max(0, fontOptions.findIndex((o) => o.id === this.data.project.content.fontId));
    const processorIndex = Math.max(0, processorOptions.findIndex((o) => o.id === this.data.project.content.processorPresetId));

    this.setData({
      machineProfileOptions: machineOptions,
      materialProfileOptions: materialOptions,
      machineProfileIndex: machineIndex,
      materialProfileIndex: materialIndex,
      fontOptions: fontOptions,
      fontIndex: fontIndex,
      processorOptions: processorOptions,
      processorIndex: processorIndex
    });
  },

  onFontChange(event) {
    const index = Number(event.detail.value);
    const font = this.data.fontOptions[index];
    if (!font) return;
    this.setData({ fontIndex: index, "project.content.fontId": font.id });
    this.markDirty();
  },

  onContentInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`project.content.${field}`]: Number(event.detail.value || 0) });
    this.markDirty();
  },

  onAlignChange(event) {
    const value = event.currentTarget.dataset.value;
    this.setData({ "project.layout.align": value });
    this.markDirty();
  },

  onProcessorChange(event) {
    const index = Number(event.detail.value);
    const processor = this.data.processorOptions[index];
    if (!processor) return;
    this.setData({ processorIndex: index, "project.content.processorPresetId": processor.id });
    this.markDirty();
  },

  markDirty() {
    this.setData({ dirty: true });
  },

  onNameInput(event) {
    this.setData({ "project.name": event.detail.value });
    this.markDirty();
  },

  onTextInput(event) {
    this.setData({ "project.content.text": event.detail.value });
    this.markDirty();
  },

  onLayoutInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`project.layout.${field}`]: Number(event.detail.value || 0) });
    this.markDirty();
  },

  onParamInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`project.processParams.${field}`]: Number(event.detail.value || 0) });
    this.markDirty();
  },

  onMachineProfileChange(event) {
    const index = Number(event.detail.value);
    const profile = this.data.machineProfileOptions[index];
    if (!profile) return;
    this.setData({ machineProfileIndex: index, "project.machineProfileId": profile.id });
    this.markDirty();
  },

  onMaterialProfileChange(event) {
    const index = Number(event.detail.value);
    const profile = this.data.materialProfileOptions[index];
    if (!profile) return;
    this.setData({ materialProfileIndex: index, "project.materialProfileId": profile.id });
    this.markDirty();
  },

  setTextMode() {
    this.setData({ "project.sourceType": "text", "project.content.imageAssetId": null });
    this.markDirty();
  },

  setImageMode() {
    this.setData({ "project.sourceType": "image", "project.content.text": "" });
    this.markDirty();
  },

  chooseImage() {
    if (typeof wx === "undefined" || typeof wx.chooseImage !== "function") {
      this.setData({ "project.content.imageAssetId": "ast_mock_001" });
      this.markDirty();
      return;
    }
    wx.chooseImage({
      count: 1,
      success: async (res) => {
        const tempPath = res.tempFilePaths[0];
        wx.showLoading({ title: "上传中..." });
        try {
          const result = await api.uploadImage(this.data.id, tempPath);
          this.setData({ "project.content.imageAssetId": result.assetId });
          this.markDirty();
          wx.hideLoading();
        } catch (error) {
          wx.hideLoading();
          wx.showToast({ title: "上传失败，使用示例图片", icon: "none" });
          this.mockUploadImage();
        }
      }
    });
  },

  mockUploadImage() {
    this.setData({ "project.content.imageAssetId": "ast_mock_001" });
    this.markDirty();
  },

  async saveProject() {
    const project = await api.saveProject(this.data.id, this.data.project);
    this.setData({ project, dirty: false });
    wx.showToast({ title: "已保存", icon: "success" });
  },

  async autoSave() {
    if (!this.data.dirty || !this.data.id) {
      return;
    }
    try {
      const project = await api.saveProject(this.data.id, this.data.project);
      this.setData({ project, dirty: false });
    } catch (error) {
      console.error("Auto-save failed", error);
    }
  },

  onHide() {
    this.autoSave();
  },

  onUnload() {
    this.autoSave();
  },

  async generatePreview() {
    this.setData({ loading: true });
    try {
      await this.autoSave();
      const result = await api.createPreview(this.data.id);
      wx.navigateTo({ url: `/pages/preview/index?projectId=${this.data.id}&previewId=${result.previewId}` });
    } finally {
      this.setData({ loading: false });
    }
  },

  goDevices() {
    wx.switchTab({ url: "/pages/devices/index" });
  }
});
