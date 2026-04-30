const api = require("../../../services/api");
const pageAuth = require("../../../utils/page-auth");
const { formatJobStatus, formatJobStep } = require("../../../utils/status-formatters");

Page({
  data: {
    id: "",
    job: {
      progress: {},
      timeline: []
    },
    canCancel: false,
    canRetry: false
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
    const job = {
      ...rawJob,
      statusLabel: formatJobStatus(rawJob.status),
      stepLabel: formatJobStep(rawJob.progress.currentStep),
      timeline: rawJob.timeline.map((item) => ({
        ...item,
        statusLabel: formatJobStatus(item.status)
      }))
    };
    this.setData({
      job,
      canCancel: ["queued", "dispatching", "running"].includes(job.status),
      canRetry: job.status === "failed" && job.failure && job.failure.retryable
    });
  },

  async cancelJob() {
    await api.cancelJob(this.data.id);
    await this.refreshJob();
  },

  async retryJob() {
    const result = await api.retryJob(this.data.id);
    wx.redirectTo({ url: `/pages/tasks/detail/index?id=${result.jobId}` });
  },

  viewProject() {
    wx.navigateTo({ url: `/pages/workspace/editor/index?id=${this.data.job.projectId}` });
  }
});
