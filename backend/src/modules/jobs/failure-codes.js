const FAILURE_CODE_MAP = {
  DEVICE_OFFLINE: {
    code: "DEVICE_OFFLINE",
    message: "Device is offline and cannot receive job dispatch",
    retryable: true
  },
  DEVICE_BUSY: {
    code: "DEVICE_BUSY",
    message: "Device is currently busy with another operation",
    retryable: true
  },
  GATEWAY_TIMEOUT: {
    code: "GATEWAY_TIMEOUT",
    message: "Gateway dispatch timed out before device acknowledged",
    retryable: true
  },
  PARAM_INVALID: {
    code: "PARAM_INVALID",
    message: "Project parameters are invalid for current execution mode",
    retryable: false
  }
};

function resolveFailure(code) {
  if (!code) {
    return null;
  }
  return FAILURE_CODE_MAP[code] || {
    code,
    message: "Job failed with an unknown error",
    retryable: false
  };
}

module.exports = {
  resolveFailure,
  FAILURE_CODE_MAP
};
