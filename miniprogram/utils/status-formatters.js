const JOB_STATUS_MAP = {
  queued: "排队中",
  dispatching: "下发中",
  running: "运行中",
  paused: "已暂停",
  failed: "失败",
  completed: "已完成",
  canceled: "已取消"
};

const DEVICE_STATUS_MAP = {
  online: "在线",
  offline: "离线",
  busy: "忙碌",
  error: "异常"
};

const PREVIEW_STATUS_MAP = {
  pending: "等待中",
  processing: "生成中",
  ready: "已完成",
  failed: "失败"
};

const JOB_STEP_MAP = {
  queued: "排队中",
  dispatching: "下发中",
  streaming: "发送中",
  running: "运行中",
  canceled: "已取消"
};

function formatByMap(value, map) {
  if (!value) {
    return "-";
  }
  return map[value] || value;
}

function formatJobStatus(value) {
  return formatByMap(value, JOB_STATUS_MAP);
}

function formatDeviceStatus(value) {
  return formatByMap(value, DEVICE_STATUS_MAP);
}

function formatPreviewStatus(value) {
  return formatByMap(value, PREVIEW_STATUS_MAP);
}

function formatJobStep(value) {
  return formatByMap(value, JOB_STEP_MAP);
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  return value.replace("T", " ").replace("Z", "");
}

module.exports = {
  formatJobStatus,
  formatDeviceStatus,
  formatPreviewStatus,
  formatJobStep,
  formatDateTime
};
