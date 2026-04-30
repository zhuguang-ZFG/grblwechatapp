const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");
const { formatJobStatus, formatJobStep } = require("../../../utils/status-formatters");

const FAILURE_SUGGESTION_MAP = {
  DEVICE_OFFLINE: "设备当前离线，请检查设备通电与网络连接后再重试。",
  DEVICE_BUSY: "设备当前忙碌，请等待当前任务完成后再重试。",
  GATEWAY_TIMEOUT: "网关下发超时，请确认设备连接稳定后再重试。",
  GENERATION_NOT_READY: "生成结果尚未就绪，请稍后刷新状态后再重试。",
  PREVIEW_NOT_READY: "预览结果尚未就绪，请先完成预览再重试。",
  PARAM_INVALID: "参数配置无效，请调整加工参数后重新提交任务。"
};

function getFailureSuggestion(failure) {
  if (!failure || !failure.code) {
    return "";
  }
  return FAILURE_SUGGESTION_MAP[failure.code] || "可先刷新状态并检查设备与项目参数，再尝试重试任务。";
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

function showActionToast(title) {
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
    id: "",
    job: {
      progress: {},
      timeline: []
    },
    canCancel: false,
    canRetry: false,
    actionLoading: false,
    actionKind: ""
  },

  async onLoad(options) {
    if (!pageAuth.requireAuth()) {
      return;
    }
    this.setData({ id: options.id });
    await this.refreshJob();
  },

  async refreshJob() {
    const rawJob = await api.getJob(this.data.id);
    let projectName = rawJob.projectId;
    let deviceName = rawJob.deviceId;

    try {
      const [project, devices] = await Promise.all([
        api.getProject(rawJob.projectId),
        api.listDevices()
      ]);
      if (project && project.name) {
        projectName = project.name;
      }
      const matchedDevice = ((devices && devices.items) || []).find((item) => item.id === rawJob.deviceId);
      if (matchedDevice && matchedDevice.name) {
        deviceName = matchedDevice.name;
      }
    } catch (error) {
      // Keep detail view resilient if auxiliary lookups fail.
    }

    const job = {
      ...rawJob,
      projectName,
      deviceName,
      statusLabel: formatJobStatus(rawJob.status),
      stepLabel: formatJobStep(rawJob.progress.currentStep),
      failureSuggestion: getFailureSuggestion(rawJob.failure),
      timeline: rawJob.timeline.map((item) => ({
        ...item,
        statusLabel: formatJobStatus(item.status)
      }))
    };
    const canRetry = job.status === "failed" && job.failure && job.failure.retryable;
    this.setData({
      job,
      canCancel: ["queued", "dispatching", "running"].includes(job.status),
      canRetry,
      retryHint: job.status === "failed" && job.failure && !job.failure.retryable
        ? "当前错误不支持直接重试，请先调整项目参数后重新提交任务。"
        : ""
    });
  },

  async cancelJob() {
    if (this.data.actionLoading) {
      return;
    }
    this.setData({ actionLoading: true, actionKind: "cancel" });
    const confirmed = await confirmAction({
      title: "取消任务",
      content: "取消后将停止当前任务，是否继续？"
    });
    if (!confirmed) {
      this.setData({ actionLoading: false, actionKind: "" });
      return;
    }
    try {
      await api.cancelJob(this.data.id);
      await this.refreshJob();
    } catch (error) {
      if (error && error.code === "invalid_cancel_target") {
        showActionToast("当前任务不可取消");
        await this.refreshJob();
      }
    } finally {
      this.setData({ actionLoading: false, actionKind: "" });
    }
  },

  async retryJob() {
    if (this.data.actionLoading) {
      return;
    }
    if (!this.data.canRetry) {
      showActionToast("当前任务不可重试");
      return;
    }
    this.setData({ actionLoading: true, actionKind: "retry" });
    const confirmed = await confirmAction({
      title: "重试任务",
      content: "将基于当前任务创建新任务重试，是否继续？"
    });
    if (!confirmed) {
      this.setData({ actionLoading: false, actionKind: "" });
      return;
    }
    try {
      const result = await api.retryJob(this.data.id);
      wx.redirectTo({ url: `/pages/tasks/detail/index?id=${result.jobId}` });
    } catch (error) {
      if (error && error.code === "invalid_retry_target") {
        showActionToast("当前任务不可重试");
        await this.refreshJob();
      }
    } finally {
      this.setData({ actionLoading: false, actionKind: "" });
    }
  },

  viewProject() {
    wx.navigateTo({ url: `/pages/workspace/editor/index?id=${this.data.job.projectId}` });
  }
});

if (typeof module !== "undefined") {
  module.exports = {
    FAILURE_SUGGESTION_MAP,
    getFailureSuggestion
  };
}
