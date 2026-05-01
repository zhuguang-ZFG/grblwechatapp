const { request } = require("../../utils/request");
const session = require("../../utils/session");

const SELECTED_DEVICE_KEY = "selectedDevice";

function getWechatLoginCode(mode) {
  if (typeof wx === "undefined" || typeof wx.login !== "function") {
    return Promise.resolve(`mock-code-${mode || "existing"}`);
  }

  return new Promise((resolve, reject) => {
    wx.login({
      success(result) {
        if (result && result.code) {
          resolve(result.code);
          return;
        }
        reject(new Error("wx.login returned no code"));
      },
      fail(error) {
        reject(error);
      }
    });
  });
}

function getStorage() {
  if (typeof wx === "undefined") {
    return null;
  }
  return wx;
}

module.exports = {
  async wechatLogin(mode) {
    const code = await getWechatLoginCode(mode);
    return request({
      url: "/auth/wechat-login",
      method: "POST",
      data: {
        code,
        profile: {
          nickname: "WeChat User",
          avatarUrl: ""
        }
      }
    });
  },

  register(payload) {
    const pendingRegistration = session.getPendingRegistration() || {};
    return request({
      url: "/auth/register",
      method: "POST",
      data: Object.assign({}, payload, {
        tempAuthToken: pendingRegistration.tempAuthToken
      })
    });
  },

  completeProfile(payload) {
    return request({
      url: "/auth/complete-profile",
      method: "POST",
      data: payload
    });
  },

  getMe() {
    return request({ url: "/auth/me" });
  },

  listDevices() {
    return request({ url: "/devices" });
  },

  listMachineProfiles() {
    return request({ url: "/machine-profiles" });
  },

  listMaterialProfiles() {
    return request({ url: "/material-profiles" });
  },

  listFonts() {
    return request({ url: "/fonts" });
  },

  listImageProcessors() {
    return request({ url: "/image-processors" });
  },

  bindDevice(bindingCode) {
    return request({
      url: "/devices/bind",
      method: "POST",
      data: { bindingCode }
    }).then(async (result) => {
      const devices = await this.listDevices();
      const selectedDevice = (devices.items || []).find((item) => item.id === result.deviceId);
      if (selectedDevice) {
        this.setSelectedDevice(selectedDevice);
      }
      return result;
    });
  },

  createProject(sourceType, selectedDeviceId) {
    const data = {
      name: sourceType === "image" ? "New image project" : "New text project",
      sourceType
    };
    if (selectedDeviceId) {
      data.selectedDeviceId = selectedDeviceId;
    }
    return request({
      url: "/projects",
      method: "POST",
      data
    });
  },

  async listProjects() {
    const response = await request({
      url: "/projects?page=1&pageSize=20"
    });
    return response.items || [];
  },

  getProject(projectId) {
    return request({ url: `/projects/${projectId}` });
  },

  saveProject(projectId, payload) {
    return request({
      url: `/projects/${projectId}`,
      method: "PUT",
      data: payload
    });
  },

  duplicateProject(projectId) {
    return request({
      url: `/projects/${projectId}/duplicate`,
      method: "POST"
    });
  },

  archiveProject(projectId) {
    return request({
      url: `/projects/${projectId}/archive`,
      method: "POST"
    });
  },

  restoreProject(projectId) {
    return request({
      url: `/projects/${projectId}/restore`,
      method: "POST"
    });
  },

  deleteProject(projectId) {
    return request({
      url: `/projects/${projectId}`,
      method: "DELETE"
    });
  },

  uploadImage(projectId, tempFilePath) {
    return request({
      url: `/projects/${projectId}/assets`,
      method: "POST",
      data: {
        fileName: tempFilePath.split("/").pop() || tempFilePath.split("\\").pop() || "image.png"
      }
    });
  },

  createPreview(projectId) {
    return request({
      url: `/projects/${projectId}/preview`,
      method: "POST",
      data: { forceRegenerate: true }
    });
  },

  getPreview(previewId) {
    return request({ url: `/previews/${previewId}` });
  },

  createGeneration(projectId, previewId) {
    return request({
      url: `/projects/${projectId}/generate`,
      method: "POST",
      data: { previewId }
    });
  },

  getGeneration(generationId) {
    return request({ url: `/generations/${generationId}` });
  },

  createJob(payload) {
    return request({
      url: "/jobs",
      method: "POST",
      data: payload
    });
  },

  listJobs(status, failureCategory) {
    const query = [];
    if (status && status !== "all") {
      query.push(`status=${encodeURIComponent(status)}`);
    }
    if (failureCategory && failureCategory !== "all") {
      query.push(`failureCategory=${encodeURIComponent(failureCategory)}`);
    }
    return request({
      url: `/jobs${query.length ? `?${query.join("&")}` : ""}`
    });
  },

  getJob(jobId) {
    return request({ url: `/jobs/${jobId}` });
  },

  retryJob(jobId) {
    return request({
      url: `/jobs/${jobId}/retry`,
      method: "POST"
    });
  },

  cancelJob(jobId) {
    return request({
      url: `/jobs/${jobId}/cancel`,
      method: "POST"
    });
  },

  setSelectedDevice(device) {
    const storage = getStorage();
    if (!storage) {
      return device;
    }
    storage.setStorageSync(SELECTED_DEVICE_KEY, device);
    return device;
  },

  getSelectedDevice() {
    const storage = getStorage();
    if (!storage) {
      return {};
    }
    return storage.getStorageSync(SELECTED_DEVICE_KEY) || {};
  }
};
