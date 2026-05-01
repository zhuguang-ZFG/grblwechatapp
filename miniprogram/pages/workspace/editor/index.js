const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");
const { formatDeviceStatus } = require("../../../utils/status-formatters");

Page({
  data: {
    id: "",
    loading: false,
    dirty: false,
    showPreview: true,
    gestureInfo: { visible: false, text: "" },
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
      content: { text: "", imageAssetId: null, fontId: "fnt_001", fontSize: 100, lineGap: 0, charSpacing: 0, strokeWidth: 0, processorPresetId: null, cropBounds: null, offsetXMm: 0, offsetYMm: 0, scaleFactor: 1, contentRotation: 0 },
      layout: { widthMm: 80, heightMm: 50, rotationDeg: 0, align: "center", blockWidth: 0 },
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

  onCanvasTouchStart(event) {
    const touches = event.touches;
    if (!touches || touches.length === 0) return;

    if (touches.length === 1) {
      this._touchState = {
        type: "pan",
        startX: touches[0].x,
        startY: touches[0].y,
        startOffsetX: this.data.project.content.offsetXMm || 0,
        startOffsetY: this.data.project.content.offsetYMm || 0
      };
    } else {
      const dx = touches[0].x - touches[1].x;
      const dy = touches[0].y - touches[1].y;
      this._touchState = {
        type: "transform",
        startDist: Math.sqrt(dx * dx + dy * dy),
        startAngle: Math.atan2(dy, dx),
        startScale: this.data.project.content.scaleFactor || 1,
        startRotation: this.data.project.content.contentRotation || 0
      };
    }
  },

  onCanvasTouchMove(event) {
    if (!this._touchState) return;
    const touches = event.touches;
    if (!touches) return;

    const mmW = Math.max(this.data.project.layout.widthMm || 80, 1);
    const mmH = Math.max(this.data.project.layout.heightMm || 50, 1);
    const w = this.canvasWidth || 280;
    const h = this.canvasHeight || 280;
    const maxDrawW = w - 48;
    const maxDrawH = h - 48;
    const scale = Math.min(maxDrawW / mmW, maxDrawH / mmH);

    if (this._touchState.type === "pan" && touches.length >= 1) {
      const dxPx = touches[0].x - this._touchState.startX;
      const dyPx = touches[0].y - this._touchState.startY;
      const offsetXMm = this._touchState.startOffsetX + dxPx / scale;
      const offsetYMm = this._touchState.startOffsetY + dyPx / scale;
      this.setData({
        "project.content.offsetXMm": offsetXMm,
        "project.content.offsetYMm": offsetYMm
      });
      this._showGestureHUD(`偏移 ${offsetXMm > 0 ? "+" : ""}${offsetXMm.toFixed(1)}, ${offsetYMm > 0 ? "+" : ""}${offsetYMm.toFixed(1)} mm`);
    } else if (this._touchState.type === "transform" && touches.length >= 2) {
      const dx = touches[0].x - touches[1].x;
      const dy = touches[0].y - touches[1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      if (this._touchState.startDist > 0) {
        const scaleFactor = Math.max(0.1, Math.min(10, this._touchState.startScale * (dist / this._touchState.startDist)));
        let rotDelta = (angle - this._touchState.startAngle) * 180 / Math.PI;
        const contentRotation = ((this._touchState.startRotation + rotDelta) % 360 + 360) % 360;
        this.setData({
          "project.content.scaleFactor": scaleFactor,
          "project.content.contentRotation": contentRotation
        });
        this._showGestureHUD(`缩放 ${scaleFactor.toFixed(2)}x 旋转 ${contentRotation.toFixed(0)}°`);
      }
    }
    this.renderPreview();
  },

  onCanvasTouchEnd() {
    if (!this._touchState) return;
    this._touchState = null;
    this.markDirty();
    clearTimeout(this._hudTimer);
    this._hudTimer = setTimeout(() => {
      this.setData({ "gestureInfo.visible": false });
    }, 1500);
  },

  _showGestureHUD(text) {
    this.setData({ gestureInfo: { visible: true, text } });
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

    // Content transform (offset, scale, rotation)
    const centerX = offsetX + drawW / 2;
    const centerY = offsetY + drawH / 2;
    const offX = (project.content.offsetXMm || 0) * scale;
    const offY = (project.content.offsetYMm || 0) * scale;
    const sF = project.content.scaleFactor || 1;
    const cRot = project.content.contentRotation || 0;

    ctx.save();
    ctx.translate(centerX + offX, centerY + offY);
    ctx.rotate(cRot * Math.PI / 180);
    ctx.scale(sF, sF);
    ctx.translate(-centerX, -centerY);

    if (project.sourceType === "text" && project.content.text) {
      this.renderTextPreview(ctx, offsetX, offsetY, drawW, drawH, scale);
    } else if (project.sourceType === "image") {
      this.renderImagePreview(ctx, offsetX, offsetY, drawW, drawH);
    }

    ctx.restore();

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

    // Gesture HUD
    if (this.data.gestureInfo.visible && this.data.gestureInfo.text) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.roundRect ? ctx.roundRect(8, 8, 200, 28, 6) : null;
      ctx.fillRect(8, 8, 200, 28);
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(this.data.gestureInfo.text, 16, 21);
      ctx.restore();
    }
  },

  renderTextPreview(ctx, offsetX, offsetY, drawW, drawH, scale) {
    const { project } = this.data;
    const fontSize = Math.max(Math.round((project.content.fontSize || 100) * scale * 0.14), 8);
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textBaseline = "middle";

    const align = project.layout.align || "center";
    let textAlign;
    if (align === "left") {
      textAlign = "left";
    } else if (align === "right") {
      textAlign = "right";
    } else {
      textAlign = "center";
    }
    ctx.textAlign = textAlign;

    const charSpacing = (project.content.charSpacing || 0) * scale * 0.14;
    const strokeWidth = (project.content.strokeWidth || 0) * scale * 0.14;
    const rawLines = project.content.text.split("\n");

    // Apply block width wrapping
    const blockWidth = project.layout.blockWidth || 0;
    const maxLinePx = blockWidth > 0 ? blockWidth * scale : drawW;
    const lines = [];
    rawLines.forEach((rawLine) => {
      if (blockWidth <= 0) {
        lines.push(rawLine);
        return;
      }
      let remaining = rawLine;
      while (remaining.length > 0) {
        let cut = remaining.length;
        for (let i = 1; i <= remaining.length; i++) {
          if (ctx.measureText(remaining.substring(0, i)).width > maxLinePx) {
            cut = i - 1;
            break;
          }
        }
        if (cut <= 0) cut = 1;
        lines.push(remaining.substring(0, cut));
        remaining = remaining.substring(cut);
      }
    });

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

    ctx.fillStyle = "#ffffff";
    if (strokeWidth > 0) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = strokeWidth;
    }

    lines.forEach((line) => {
      if (charSpacing > 0 && line.length > 1) {
        // Draw each character individually for spacing
        const chars = line.split("");
        const totalCharWidth = chars.reduce((sum, ch) => sum + ctx.measureText(ch).width, 0);
        const totalSpacing = charSpacing * (chars.length - 1);
        let charX;
        if (align === "center") {
          charX = textX - (totalCharWidth + totalSpacing) / 2;
        } else if (align === "right") {
          charX = textX - (totalCharWidth + totalSpacing);
        } else {
          charX = textX;
        }
        chars.forEach((ch) => {
          if (strokeWidth > 0) ctx.strokeText(ch, charX, startY);
          ctx.fillText(ch, charX, startY);
          charX += ctx.measureText(ch).width + charSpacing;
        });
      } else {
        if (strokeWidth > 0) ctx.strokeText(line, textX, startY);
        ctx.fillText(line, textX, startY);
      }
      startY += lineH;
    });
  },

  renderImagePreview(ctx, offsetX, offsetY, drawW, drawH) {
    const { project } = this.data;
    const margin = 4;
    ctx.fillStyle = "#555555";
    ctx.fillRect(offsetX + margin, offsetY + margin, drawW - margin * 2, drawH - margin * 2);

    // Draw crop bounds overlay if set
    const crop = project.content.cropBounds;
    if (crop && crop.width > 0 && crop.height > 0 && project.content.imageAssetId) {
      // Scale crop to canvas pixels
      const mmW = Math.max(project.layout.widthMm || 80, 1);
      const mmH = Math.max(project.layout.heightMm || 50, 1);
      const scaleX = drawW / mmW;
      const scaleY = drawH / mmH;
      const cx = offsetX + crop.x * scaleX;
      const cy = offsetY + crop.y * scaleY;
      const cw = crop.width * scaleX;
      const ch = crop.height * scaleY;

      // Dim outside crop area
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(offsetX + margin, offsetY + margin, drawW - margin * 2, drawH - margin * 2);

      // Clear crop area
      ctx.clearRect(cx, cy, cw, ch);

      // Crop border
      ctx.strokeStyle = "#69db7c";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(cx, cy, cw, ch);
      ctx.setLineDash([]);

      // Crop label
      ctx.fillStyle = "#69db7c";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(`裁剪 ${crop.width}×${crop.height}`, cx + 4, cy + 4);
    } else {
      // Center icon/text
      ctx.fillStyle = "#888888";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "14px sans-serif";
      if (project.content.imageAssetId) {
        ctx.fillText("素材已选择", offsetX + drawW / 2, offsetY + drawH / 2);
      } else {
        ctx.fillText("未选择素材", offsetX + drawW / 2, offsetY + drawH / 2);
      }
    }
  },

  async loadProject() {
    try {
      const project = await api.getProject(this.data.id);
      this.setData({ project });
      this.scheduleRender();
    } catch (error) {
      wx.showToast({ title: "加载项目失败", icon: "none" });
    }
  },

  async loadDevice() {
    try {
      const device = await api.getSelectedDevice();
      const deviceInfo = device
        ? { ...device, onlineStatusLabel: formatDeviceStatus(device.onlineStatus) }
        : {};
      this.setData({ device: deviceInfo });
    } catch (error) {
      wx.showToast({ title: "加载设备信息失败", icon: "none" });
    }
  },

  async loadProfiles() {
    try {
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
    } catch (error) {
      wx.showToast({ title: "加载配置列表失败", icon: "none" });
    }
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

  onCropInput(event) {
    const field = event.currentTarget.dataset.field;
    const value = Number(event.detail.value || 0);
    const bounds = Object.assign({}, this.data.project.content.cropBounds || { x: 0, y: 0, width: 100, height: 100 });
    bounds[field] = value;
    this.setData({ "project.content.cropBounds": bounds });
    this.markDirty();
    this.scheduleRender();
  },

  clearCrop() {
    this.setData({ "project.content.cropBounds": null });
    this.markDirty();
    this.scheduleRender();
  },

  async saveProject() {
    try {
      const project = await api.saveProject(this.data.id, this.data.project);
      this.setData({ project, dirty: false });
      wx.showToast({ title: "已保存", icon: "success" });
    } catch (error) {
      wx.showToast({ title: "保存失败", icon: "none" });
    }
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
      // Preflight check before generating
      const check = await api.preflightCheck(this.data.id);
      if (!check.valid) {
        const msg = check.errors.map((e) => e.message).join("；");
        wx.showModal({ title: "提交前检查不通过", content: msg, showCancel: false });
        return;
      }
      if (check.warnings && check.warnings.length > 0) {
        const msg = check.warnings.map((e) => e.message).join("；");
        wx.showModal({ title: "注意", content: msg, confirmText: "继续" });
      }
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

  async exportProject() {
    wx.showLoading({ title: "导出中..." });
    try {
      const data = await api.exportProject(this.data.id);
      const json = JSON.stringify(data, null, 2);
      if (typeof wx !== "undefined" && wx.getFileSystemManager) {
        const fs = wx.getFileSystemManager();
        const filePath = `${wx.env.USER_DATA_PATH}/${this.data.project.name || "project"}.json`;
        fs.writeFileSync(filePath, json, "utf8");
        wx.showToast({ title: "已导出", icon: "success" });
        wx.setClipboardData({ data: json });
      } else {
        wx.setClipboardData({ data: json });
        wx.showToast({ title: "已复制到剪贴板", icon: "success" });
      }
    } catch (err) {
      wx.showToast({ title: "导出失败", icon: "none" });
    } finally {
      wx.hideLoading();
    }
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
