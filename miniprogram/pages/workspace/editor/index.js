const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");
const { formatDeviceStatus } = require("../../../utils/status-formatters");

Page({
  data: {
    id: "",
    loading: false,
    dirty: false,
    showPreview: true,
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

  onReady() {
    if (typeof wx === "undefined" || typeof wx.createSelectorQuery !== "function") {
      return;
    }
    const query = wx.createSelectorQuery();
    query.select("#editorPreviewCanvas").fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) {
        return;
      }
      const canvas = res[0].node;
      const ctx = canvas.getContext("2d");
      const dpr = wx.getSystemInfoSync().pixelRatio || 1;
      canvas.width = res[0].width * dpr;
      canvas.height = res[0].height * dpr;
      ctx.scale(dpr, dpr);
      this.canvas = canvas;
      this.ctx = ctx;
      this.canvasWidth = res[0].width;
      this.canvasHeight = res[0].height;
      this.renderPreview();
    });
  },

  togglePreview() {
    this.setData({ showPreview: !this.data.showPreview });
    if (this.data.showPreview) {
      setTimeout(() => this.renderPreview(), 100);
    }
  },

  scheduleRender() {
    if (this._renderTimer) {
      clearTimeout(this._renderTimer);
    }
    this._renderTimer = setTimeout(() => {
      this.renderPreview();
    }, 150);
  },

  renderPreview() {
    if (!this.ctx || !this.canvas) {
      return;
    }
    const { project } = this.data;
    const ctx = this.ctx;
    const w = this.canvasWidth || 280;
    const h = this.canvasHeight || 280;

    ctx.clearRect(0, 0, w, h);

    // Machine bed background
    ctx.fillStyle = "#2a2a2a";
    ctx.fillRect(0, 0, w, h);

    // Scale work area to fit canvas
    const padding = 24;
    const maxDrawW = w - padding * 2;
    const maxDrawH = h - padding * 2;
    const mmW = Math.max(project.layout.widthMm || 80, 1);
    const mmH = Math.max(project.layout.heightMm || 50, 1);
    const scale = Math.min(maxDrawW / mmW, maxDrawH / mmH);
    const drawW = mmW * scale;
    const drawH = mmH * scale;
    const offsetX = (w - drawW) / 2;
    const offsetY = (h - drawH) / 2;

    ctx.save();

    // Apply rotation around center of work area
    ctx.translate(offsetX + drawW / 2, offsetY + drawH / 2);
    ctx.rotate((project.layout.rotationDeg || 0) * Math.PI / 180);
    ctx.translate(-(offsetX + drawW / 2), -(offsetY + drawH / 2));

    // Work area fill
    ctx.fillStyle = "#3d3d3d";
    ctx.fillRect(offsetX, offsetY, drawW, drawH);

    // Grid pattern (subtle)
    ctx.strokeStyle = "#4a4a4a";
    ctx.lineWidth = 0.5;
    const gridStep = 10 * scale;
    for (let x = offsetX; x <= offsetX + drawW; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, offsetY);
      ctx.lineTo(x, offsetY + drawH);
      ctx.stroke();
    }
    for (let y = offsetY; y <= offsetY + drawH; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(offsetX, y);
      ctx.lineTo(offsetX + drawW, y);
      ctx.stroke();
    }

    // Work area border
    ctx.strokeStyle = "#888888";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(offsetX, offsetY, drawW, drawH);

    // Content rendering
    if (project.sourceType === "text" && project.content.text) {
      this.renderTextPreview(ctx, offsetX, offsetY, drawW, drawH, scale);
    } else if (project.sourceType === "image") {
      this.renderImagePreview(ctx, offsetX, offsetY, drawW, drawH);
    }

    ctx.restore();

    // Dimension labels outside work area
    ctx.fillStyle = "#999999";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(`${mmW} mm`, offsetX + drawW / 2, offsetY + drawH + 6);

    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`${mmH} mm`, offsetX + drawW + 6, offsetY + drawH / 2);
  },

  renderTextPreview(ctx, offsetX, offsetY, drawW, drawH, scale) {
    const { project } = this.data;
    const fontSize = Math.max(Math.round((project.content.fontSize || 100) * scale * 0.14), 10);
    ctx.fillStyle = "#ffffff";
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textBaseline = "middle";

    const align = project.layout.align || "center";
    if (align === "left") {
      ctx.textAlign = "left";
    } else if (align === "right") {
      ctx.textAlign = "right";
    } else {
      ctx.textAlign = "center";
    }

    const lines = project.content.text.split("\n");
    const lineGap = (project.content.lineGap || 0) * scale * 0.14;
    const lineH = fontSize + lineGap;
    const totalH = lines.length * lineH;
    let startY = offsetY + (drawH - totalH) / 2 + fontSize / 2;

    let textX;
    if (align === "center") {
      textX = offsetX + drawW / 2;
    } else if (align === "left") {
      textX = offsetX + 10;
    } else {
      textX = offsetX + drawW - 10;
    }

    lines.forEach((line) => {
      ctx.fillText(line, textX, startY);
      startY += lineH;
    });
  },

  renderImagePreview(ctx, offsetX, offsetY, drawW, drawH) {
    const { project } = this.data;
    // Draw placeholder for image mode
    ctx.fillStyle = "#555555";
    ctx.fillRect(offsetX + 4, offsetY + 4, drawW - 8, drawH - 8);

    // Center icon/text
    ctx.fillStyle = "#888888";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "14px sans-serif";
    if (project.content.imageAssetId) {
      ctx.fillText("🖼", offsetX + drawW / 2, offsetY + drawH / 2 - 14);
      ctx.fillText("素材已选择", offsetX + drawW / 2, offsetY + drawH / 2 + 10);
    } else {
      ctx.fillText("📷", offsetX + drawW / 2, offsetY + drawH / 2 - 14);
      ctx.fillText("未选择素材", offsetX + drawW / 2, offsetY + drawH / 2 + 10);
    }
  },

  async loadProject() {
    const project = await api.getProject(this.data.id);
    this.setData({ project });
    this.scheduleRender();
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
    this.scheduleRender();
  },

  onContentInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`project.content.${field}`]: Number(event.detail.value || 0) });
    this.markDirty();
    this.scheduleRender();
  },

  onAlignChange(event) {
    const value = event.currentTarget.dataset.value;
    this.setData({ "project.layout.align": value });
    this.markDirty();
    this.scheduleRender();
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
    this.scheduleRender();
  },

  onLayoutInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({ [`project.layout.${field}`]: Number(event.detail.value || 0) });
    this.markDirty();
    this.scheduleRender();
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
    this.scheduleRender();
  },

  setImageMode() {
    this.setData({ "project.sourceType": "image", "project.content.text": "" });
    this.markDirty();
    this.scheduleRender();
  },

  chooseImage() {
    if (typeof wx === "undefined" || typeof wx.chooseImage !== "function") {
      this.setData({ "project.content.imageAssetId": "ast_mock_001" });
      this.markDirty();
      this.scheduleRender();
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
          this.scheduleRender();
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
    this.scheduleRender();
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
  },

  showSaveTemplate() {
    this.setData({
      showSaveTemplate: true,
      templateName: this.data.project.name || "",
      templateDescription: "",
      templateCategory: "自定义"
    });
  },

  cancelSaveTemplate() {
    this.setData({ showSaveTemplate: false });
  },

  onTemplateNameInput(event) {
    this.setData({ templateName: event.detail.value });
  },

  onTemplateDescInput(event) {
    this.setData({ templateDescription: event.detail.value });
  },

  onTemplateCategoryChange(event) {
    const index = Number(event.detail.value);
    const categories = ["自定义", "礼品", "标牌", "工艺"];
    this.setData({ templateCategory: categories[index] || "自定义" });
  },

  async confirmSaveTemplate() {
    const name = this.data.templateName.trim();
    if (!name) {
      wx.showToast({ title: "请输入模板名称", icon: "none" });
      return;
    }
    try {
      await api.createTemplate({
        name,
        description: this.data.templateDescription.trim(),
        category: this.data.templateCategory,
        sourceType: this.data.project.sourceType,
        content: this.data.project.content,
        layout: this.data.project.layout,
        processParams: this.data.project.processParams
      });
      wx.showToast({ title: "已保存为模板", icon: "success" });
      this.setData({ showSaveTemplate: false });
    } catch (error) {
      wx.showToast({ title: "保存失败", icon: "none" });
    }
  }
});
