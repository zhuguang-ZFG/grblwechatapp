const assert = require("assert");
const path = require("path");

const pagePath = path.resolve(__dirname, "../miniprogram/pages/tasks/detail/index.js");
const apiPath = path.resolve(__dirname, "../miniprogram/services/api/index.js");
const pageAuthPath = path.resolve(__dirname, "../miniprogram/utils/page-auth.js");
const formatterPath = path.resolve(__dirname, "../miniprogram/utils/status-formatters.js");

function loadTaskDetailPage({ modalConfirm = true, getJobResponse } = {}) {
  delete require.cache[pagePath];

  let pageDefinition = null;
  const calls = {
    cancelJob: 0,
    retryJob: 0,
    redirectTo: [],
    showModal: 0,
    showToast: []
  };

  global.Page = (definition) => {
    pageDefinition = definition;
  };

  global.wx = {
    showModal(options) {
      calls.showModal += 1;
      options.success({ confirm: modalConfirm });
    },
    redirectTo(options) {
      calls.redirectTo.push(options.url);
    },
    showToast(options) {
      calls.showToast.push(options.title);
    }
  };

  require.cache[apiPath] = {
    id: apiPath,
    filename: apiPath,
    loaded: true,
    exports: {
      async cancelJob() {
        calls.cancelJob += 1;
      },
      async retryJob() {
        calls.retryJob += 1;
        return { jobId: "job_retry_1" };
      },
      async getJob() {
        return getJobResponse || {
          id: "job_1",
          projectId: "prj_1",
          deviceId: "dev_123",
          status: "queued",
          progress: { currentStep: "queued", percent: 0 },
          timeline: []
        };
      },
      async getProject() {
        return { id: "prj_1", name: "Project A" };
      },
      async listDevices() {
        return {
          items: [
            { id: "dev_1", name: "KX Laser A1" },
            { id: "dev_123", name: "KX Laser A1" }
          ]
        };
      }
    }
  };

  require.cache[pageAuthPath] = {
    id: pageAuthPath,
    filename: pageAuthPath,
    loaded: true,
    exports: {
      requireAuth() {
        return true;
      }
    }
  };

  require.cache[formatterPath] = {
    id: formatterPath,
    filename: formatterPath,
    loaded: true,
    exports: {
      formatJobStatus(value) {
        return value;
      },
      formatJobStep(value) {
        return value;
      }
    }
  };

  require(pagePath);

  return { pageDefinition, calls };
}

async function run() {
  const declined = loadTaskDetailPage({ modalConfirm: false });
  let refreshCount = 0;
  const declinedCtx = {
    data: { id: "job_1", actionLoading: false, actionKind: "" },
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    },
    refreshJob: async () => {
      refreshCount += 1;
    }
  };
  await declined.pageDefinition.cancelJob.call(declinedCtx);
  assert.strictEqual(declined.calls.showModal, 1);
  assert.strictEqual(declined.calls.cancelJob, 0);
  assert.strictEqual(refreshCount, 0);
  assert.strictEqual(declinedCtx.data.actionLoading, false);
  assert.strictEqual(declinedCtx.data.actionKind, "");

  const accepted = loadTaskDetailPage({ modalConfirm: true });
  refreshCount = 0;
  const acceptedCtx = {
    data: { id: "job_1", actionLoading: false, actionKind: "" },
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    },
    refreshJob: async () => {
      refreshCount += 1;
    }
  };
  await accepted.pageDefinition.cancelJob.call(acceptedCtx);
  assert.strictEqual(accepted.calls.cancelJob, 1);
  assert.strictEqual(refreshCount, 1);
  assert.strictEqual(acceptedCtx.data.actionLoading, false);
  assert.strictEqual(acceptedCtx.data.actionKind, "");

  const retryCtx = {
    data: { id: "job_1", actionLoading: false, actionKind: "", canRetry: true },
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    }
  };
  await accepted.pageDefinition.retryJob.call(retryCtx);
  assert.strictEqual(accepted.calls.retryJob, 1);
  assert.deepStrictEqual(accepted.calls.redirectTo, ["/pages/tasks/detail/index?id=job_retry_1"]);
  assert.strictEqual(retryCtx.data.actionLoading, false);
  assert.strictEqual(retryCtx.data.actionKind, "");

  await accepted.pageDefinition.cancelJob.call({
    data: { id: "job_1", actionLoading: true, actionKind: "cancel" },
    setData() {},
    refreshJob: async () => {}
  });
  assert.strictEqual(accepted.calls.cancelJob, 1);

  const failedJob = loadTaskDetailPage({
    getJobResponse: {
      id: "job_failed_1",
      projectId: "prj_1",
      deviceId: "dev_1",
      status: "failed",
      progress: { currentStep: "running", percent: 62 },
      failure: {
        code: "DEVICE_OFFLINE",
        category: "DEVICE",
        message: "device heartbeat missing",
        retryable: true
      },
      timeline: []
    }
  });
  const refreshCtx = {
    data: { id: "job_failed_1" },
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    }
  };
  await failedJob.pageDefinition.refreshJob.call(refreshCtx);
  assert.strictEqual(refreshCtx.data.job.failureSuggestion, "设备当前离线，请检查设备通电与网络连接后再重试。");
  assert.strictEqual(refreshCtx.data.job.failureCategoryLabel, "设备问题");
  assert.strictEqual(refreshCtx.data.canRetry, true);
  assert.strictEqual(refreshCtx.data.job.projectName, "Project A");
  assert.strictEqual(refreshCtx.data.job.deviceName, "KX Laser A1");

  const gatewayTimeoutJob = loadTaskDetailPage({
    getJobResponse: {
      id: "job_failed_timeout",
      projectId: "prj_1",
      deviceId: "dev_1",
      status: "failed",
      progress: { currentStep: "dispatching", percent: 24 },
      failure: {
        code: "GATEWAY_TIMEOUT",
        category: "GATEWAY",
        message: "gateway timeout",
        retryable: true
      },
      timeline: []
    }
  });
  const gatewayCtx = {
    data: { id: "job_failed_timeout" },
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    }
  };
  await gatewayTimeoutJob.pageDefinition.refreshJob.call(gatewayCtx);
  assert.strictEqual(gatewayCtx.data.job.failureSuggestion, "网关下发超时，请确认设备连接稳定后再重试。");

  const nonRetryableJob = loadTaskDetailPage({
    getJobResponse: {
      id: "job_failed_2",
      projectId: "prj_1",
      deviceId: "dev_1",
      status: "failed",
      progress: { currentStep: "running", percent: 80 },
      failure: {
        code: "PARAM_INVALID",
        category: "PARAMETER",
        message: "invalid process params",
        retryable: false
      },
      timeline: []
    }
  });
  const nonRetryableCtx = {
    data: { id: "job_failed_2" },
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    }
  };
  await nonRetryableJob.pageDefinition.refreshJob.call(nonRetryableCtx);
  assert.strictEqual(nonRetryableCtx.data.canRetry, false);
  assert.strictEqual(nonRetryableCtx.data.retryHint, "当前错误不支持直接重试，请先调整项目参数后重新提交任务。");
  assert.strictEqual(nonRetryableCtx.data.job.failureSuggestion, "参数配置无效，请调整加工参数后重新提交任务。");

  await nonRetryableJob.pageDefinition.retryJob.call({
    data: { id: "job_failed_2", actionLoading: false, actionKind: "", canRetry: false },
    setData() {}
  });
  assert.strictEqual(nonRetryableJob.calls.retryJob, 0);
  assert.strictEqual(nonRetryableJob.calls.showToast[0], "当前任务不可重试");

  const cancelInvalidJob = loadTaskDetailPage({ modalConfirm: true });
  let cancelRefreshCount = 0;
  const cancelCtx = {
    data: { id: "job_terminal_1", actionLoading: false, actionKind: "", canRetry: false },
    setData(patch) {
      this.data = Object.assign({}, this.data, patch);
    },
    refreshJob: async () => {
      cancelRefreshCount += 1;
    }
  };
  require.cache[apiPath].exports.cancelJob = async function cancelJobInvalid() {
    const error = new Error("Only active jobs can be canceled");
    error.code = "invalid_cancel_target";
    throw error;
  };
  await cancelInvalidJob.pageDefinition.cancelJob.call(cancelCtx);
  assert.strictEqual(cancelInvalidJob.calls.showToast[0], "当前任务不可取消");
  assert.strictEqual(cancelRefreshCount, 1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
