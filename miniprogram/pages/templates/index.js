const api = require("../../services/api");
const pageAuth = require("../../utils/page-auth");

Page({
  data: {
    categories: ["全部", "礼品", "标牌", "工艺"],
    categoryValues: ["", "礼品", "标牌", "工艺"],
    categoryIndex: 0,
    templates: [],
    applyingId: "",
    editingTemplate: null,
    editName: "",
    editDescription: ""
  },

  async onLoad() {
    if (!pageAuth.requireAuth()) {
      return;
    }
    await this.loadTemplates();
  },

  async onCategoryChange(event) {
    const index = Number(event.detail.value);
    this.setData({ categoryIndex: index });
    await this.loadTemplates();
  },

  async loadTemplates() {
    const category = this.data.categoryValues[this.data.categoryIndex];
    const result = await api.listTemplates(category);
    this.setData({ templates: result.items || [] });
  },

  async applyTemplate(event) {
    const templateId = event.currentTarget.dataset.id;
    if (this.data.applyingId) {
      return;
    }
    this.setData({ applyingId: templateId });
    try {
      const result = await api.applyTemplate(templateId);
      wx.showToast({ title: "已创建项目", icon: "success" });
      wx.navigateTo({
        url: `/pages/workspace/editor/index?id=${result.id}`
      });
    } catch (error) {
      wx.showToast({ title: "创建失败", icon: "none" });
    } finally {
      this.setData({ applyingId: "" });
    }
  },

  showEdit(event) {
    const template = event.currentTarget.dataset.template;
    this.setData({
      editingTemplate: template,
      editName: template.name,
      editDescription: template.description
    });
  },

  cancelEdit() {
    this.setData({ editingTemplate: null, editName: "", editDescription: "" });
  },

  onEditNameInput(event) {
    this.setData({ editName: event.detail.value });
  },

  onEditDescInput(event) {
    this.setData({ editDescription: event.detail.value });
  },

  async confirmEdit() {
    const template = this.data.editingTemplate;
    if (!template) return;
    const name = this.data.editName.trim();
    if (!name) {
      wx.showToast({ title: "请输入模板名称", icon: "none" });
      return;
    }
    try {
      await api.updateTemplate(template.id, {
        name,
        description: this.data.editDescription.trim()
      });
      wx.showToast({ title: "已更新", icon: "success" });
      this.cancelEdit();
      await this.loadTemplates();
    } catch (error) {
      wx.showToast({ title: "更新失败", icon: "none" });
    }
  },

  async deleteTemplate(event) {
    const templateId = event.currentTarget.dataset.id;
    const res = await new Promise((resolve) => {
      wx.showModal({
        title: "删除模板",
        content: "确定要删除此模板吗？此操作不可恢复。",
        success: resolve
      });
    });
    if (!res.confirm) return;
    try {
      await api.deleteTemplate(templateId);
      wx.showToast({ title: "已删除", icon: "success" });
      await this.loadTemplates();
    } catch (error) {
      wx.showToast({ title: "删除失败", icon: "none" });
    }
  }
});
