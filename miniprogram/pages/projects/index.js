const api = require("../../services/api");
const pageAuth = require("../../utils/page-auth");
const {
  formatProjectType,
  formatProjectUpdatedAt,
  formatArtifactState
} = require("../../utils/project-formatters");
const { formatDeviceStatus } = require("../../utils/status-formatters");

function showActionSheet(itemList) {
  if (typeof wx === "undefined" || typeof wx.showActionSheet !== "function") {
    return Promise.resolve({ tapIndex: 0, cancel: false });
  }
  return new Promise((resolve, reject) => {
    wx.showActionSheet({
      itemList,
      success(result) {
        resolve(result || {});
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

function confirmAction({ title, content }) {
  if (typeof wx === "undefined" || typeof wx.showModal !== "function") {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      success(result) {
        resolve(Boolean(result && result.confirm));
      },
      fail() {
        resolve(false);
      }
    });
  });
}

function showToast(title) {
  if (typeof wx === "undefined" || typeof wx.showToast !== "function") {
    return;
  }
  wx.showToast({
    title,
    icon: "none"
  });
}

Page({
  data: {
    filters: ["全部", "文字", "图片", "已归档"],
    filterValues: ["all", "text", "image", "archived"],
    filterIndex: 0,
    projects: [],
    actionLoading: false,
    actionProjectId: ""
  },

  async onShow() {
    if (!pageAuth.requireAuth()) {
      return;
    }
    await this.loadProjects();
  },

  async onFilterChange(event) {
    this.setData({ filterIndex: Number(event.detail.value) });
    await this.loadProjects();
  },

  async loadProjects() {
    const filter = this.data.filterValues[this.data.filterIndex];
    const allProjects = await api.listProjects();
    const filtered = allProjects.filter((item) => {
      const status = item.status || "draft";
      if (filter === "archived") {
        return status === "archived";
      }
      if (status === "archived") {
        return false;
      }
      if (filter === "all") {
        return true;
      }
      return item.sourceType === filter;
    });

    const devices = await api.listDevices();
    const deviceMap = Object.fromEntries((devices.items || []).map((item) => [item.id, item]));

    const projects = filtered.map((item) => {
      const status = item.status || "draft";
      const isArchived = status === "archived";
      return {
        ...item,
        sourceTypeLabel: formatProjectType(item.sourceType),
        updatedAtLabel: formatProjectUpdatedAt(item.updatedAt),
        previewStateLabel: formatArtifactState(item.latestPreviewId),
        generationStateLabel: formatArtifactState(item.latestGenerationId),
        deviceName: deviceMap[item.selectedDeviceId]?.name || item.selectedDeviceId || "未选择设备",
        deviceStatusLabel: formatDeviceStatus(deviceMap[item.selectedDeviceId]?.onlineStatus),
        isArchived,
        archivedHint: isArchived ? "已归档项目仅支持恢复或删除。" : ""
      };
    });

    this.setData({ projects });
  },

  openProject(event) {
    if (event.currentTarget.dataset.archived) {
      showToast("已归档项目请先恢复");
      return;
    }
    wx.navigateTo({ url: `/pages/workspace/editor/index?id=${event.currentTarget.dataset.id}` });
  },

  async createTextProject() {
    const selectedDevice = api.getSelectedDevice();
    const result = await api.createProject("text", selectedDevice && selectedDevice.id);
    wx.navigateTo({ url: `/pages/workspace/editor/index?id=${result.id}` });
  },

  async createImageProject() {
    const selectedDevice = api.getSelectedDevice();
    const result = await api.createProject("image", selectedDevice && selectedDevice.id);
    wx.navigateTo({ url: `/pages/workspace/editor/index?id=${result.id}` });
  },

  async openProjectActions(event) {
    if (this.data.actionLoading) {
      return;
    }
    const projectId = event.currentTarget.dataset.id;
    const isArchived = Boolean(event.currentTarget.dataset.archived);
    const actions = isArchived
      ? [
        { label: "恢复项目", handler: () => this.restoreProject(projectId) },
        { label: "删除项目", handler: () => this.deleteProject(projectId) }
      ]
      : [
        { label: "复制项目", handler: () => this.duplicateProject(projectId) },
        { label: "归档项目", handler: () => this.archiveProject(projectId) },
        { label: "删除项目", handler: () => this.deleteProject(projectId) }
      ];

    try {
      const result = await showActionSheet(actions.map((item) => item.label));
      if (typeof result.tapIndex !== "number" || result.cancel) {
        return;
      }
      const action = actions[result.tapIndex];
      if (action) {
        await action.handler();
      }
    } catch (error) {
      // Treat canceled action sheet as no-op.
    }
  },

  async duplicateProject(projectId) {
    this.setData({ actionLoading: true, actionProjectId: projectId });
    try {
      const result = await api.duplicateProject(projectId);
      showToast("已复制项目");
      await this.loadProjects();
      if (result && result.id) {
        wx.navigateTo({ url: `/pages/workspace/editor/index?id=${result.id}` });
      }
    } finally {
      this.setData({ actionLoading: false, actionProjectId: "" });
    }
  },

  async archiveProject(projectId) {
    const confirmed = await confirmAction({
      title: "归档项目",
      content: "归档后项目将从当前列表移出，是否继续？"
    });
    if (!confirmed) {
      return;
    }
    this.setData({ actionLoading: true, actionProjectId: projectId });
    try {
      await api.archiveProject(projectId);
      showToast("项目已归档");
      await this.loadProjects();
    } finally {
      this.setData({ actionLoading: false, actionProjectId: "" });
    }
  },

  async restoreProject(projectId) {
    this.setData({ actionLoading: true, actionProjectId: projectId });
    try {
      await api.restoreProject(projectId);
      showToast("项目已恢复");
      await this.loadProjects();
    } finally {
      this.setData({ actionLoading: false, actionProjectId: "" });
    }
  },

  async deleteProject(projectId) {
    const confirmed = await confirmAction({
      title: "删除项目",
      content: "删除后不可恢复，是否继续？"
    });
    if (!confirmed) {
      return;
    }
    this.setData({ actionLoading: true, actionProjectId: projectId });
    try {
      await api.deleteProject(projectId);
      showToast("项目已删除");
      await this.loadProjects();
    } finally {
      this.setData({ actionLoading: false, actionProjectId: "" });
    }
  },

  async importProject() {
    if (typeof wx === "undefined" || typeof wx.chooseMessageFile !== "function") {
      showToast("导入仅在微信环境可用");
      return;
    }
    try {
      const res = wx.chooseMessageFile({ count: 1, type: "file" });
      const file = res.tempFiles[0];
      if (!file || !file.name.endsWith(".json")) {
        showToast("请选择 .json 文件");
        return;
      }
      const fs = wx.getFileSystemManager();
      const content = fs.readFileSync(file.path, "utf8");
      const data = JSON.parse(content);
      const result = await api.importProject(data);
      showToast("已导入项目");
      wx.navigateTo({ url: `/pages/workspace/editor/index?id=${result.id}` });
    } catch (error) {
      showToast("导入失败，请检查文件格式");
    }
  }
});
