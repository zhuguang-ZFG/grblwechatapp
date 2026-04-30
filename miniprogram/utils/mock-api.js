const authExisting = {
  isNewUser: false,
  token: "mock_token_existing_user",
  user: {
    id: "usr_123",
    nickname: "Alice",
    avatarUrl: "https://mock.cdn.example/avatar/alice.png",
    mobile: "13800000000",
    profileStatus: "completed"
  },
  nextAction: "enter_app"
};

const authNew = {
  isNewUser: true,
  tempAuthToken: "mock_temp_auth_token_new_user",
  nextAction: "register"
};

const authRegister = {
  token: "mock_token_registered_user",
  user: {
    id: "usr_456",
    nickname: "New User",
    avatarUrl: "https://mock.cdn.example/avatar/new-user.png",
    mobile: "13900000000",
    profileStatus: "completed"
  },
  nextAction: "enter_app"
};

const authMe = {
  id: "usr_123",
  nickname: "Alice",
  avatarUrl: "https://mock.cdn.example/avatar/alice.png",
  mobile: "13800000000",
  companyName: "Demo Studio",
  profileStatus: "completed"
};

const devicesList = {
  items: [
    {
      id: "dev_123",
      name: "KX Laser A1",
      onlineStatus: "online",
      model: "esp32_grbl",
      lastSeenAt: "2026-05-01T10:08:00Z"
    },
    {
      id: "dev_124",
      name: "KX Laser B2",
      onlineStatus: "offline",
      model: "esp32_grbl",
      lastSeenAt: "2026-04-30T18:20:00Z"
    }
  ]
};

const projectDetailText = {
  id: "prj_123",
  name: "Mother's Day plaque",
  sourceType: "text",
  selectedDeviceId: "dev_123",
  machineProfileId: "mp_123",
  materialProfileId: "mat_123",
  content: {
    text: "Best Mom",
    imageAssetId: null
  },
  layout: {
    widthMm: 80,
    heightMm: 50,
    rotationDeg: 0,
    align: "center"
  },
  processParams: {
    speed: 1000,
    power: 65,
    passes: 1,
    lineSpacing: 1.2
  },
  latestPreviewId: "pre_123",
  latestGenerationId: "gen_123",
  updatedAt: "2026-05-01T10:05:00Z"
};

const previewReady = {
  id: "pre_123",
  status: "ready",
  previewImageUrl: "https://mock.cdn.example/previews/pre_123.png",
  previewSvgUrl: "https://mock.cdn.example/previews/pre_123.svg",
  metrics: {
    widthMm: 80,
    heightMm: 50,
    pathCount: 126,
    estimatedDurationSec: 420
  },
  warnings: []
};

const generationReady = {
  id: "gen_123",
  status: "ready",
  summary: {
    lineCount: 5204,
    estimatedDurationSec: 420,
    boundsMm: {
      width: 80,
      height: 50
    }
  }
};

const jobRunning = {
  id: "job_123",
  projectId: "prj_123",
  generationId: "gen_123",
  deviceId: "dev_123",
  status: "running",
  progress: {
    percent: 64,
    currentStep: "streaming"
  },
  failure: null,
  timeline: [
    {
      status: "queued",
      at: "2026-05-01T10:07:00Z"
    },
    {
      status: "running",
      at: "2026-05-01T10:08:00Z"
    }
  ]
};

const jobFailed = {
  id: "job_122",
  projectId: "prj_122",
  generationId: "gen_122",
  deviceId: "dev_123",
  status: "failed",
  progress: {
    percent: 12,
    currentStep: "dispatching"
  },
  failure: {
    code: "gateway_dispatch_failed",
    message: "Gateway could not reach target device",
    retryable: true
  },
  timeline: [
    {
      status: "queued",
      at: "2026-05-01T09:18:00Z"
    },
    {
      status: "dispatching",
      at: "2026-05-01T09:19:00Z"
    },
    {
      status: "failed",
      at: "2026-05-01T09:20:00Z"
    }
  ]
};

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function wait(ms = 240) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const state = {
  currentUser: null,
  selectedDeviceId: "dev_123",
  projects: [clone(projectDetailText)],
  previews: {},
  generations: {},
  jobs: [clone(jobRunning), clone(jobFailed)],
  counters: {
    project: 200,
    preview: 200,
    generation: 200,
    job: 200
  }
};

function nextId(prefix, key) {
  state.counters[key] += 1;
  return `${prefix}_${state.counters[key]}`;
}

function getSelectedDevice() {
  return clone(devicesList.items.find((item) => item.id === state.selectedDeviceId) || devicesList.items[0]);
}

async function wechatLogin(mode) {
  await wait();
  if (mode === "new") {
    return clone(authNew);
  }
  if (mode === "incomplete") {
    return {
      isNewUser: false,
      token: "mock_token_incomplete",
      user: {
        id: "usr_789",
        nickname: "Needs Profile",
        profileStatus: "incomplete"
      },
      nextAction: "complete_profile"
    };
  }
  state.currentUser = clone(authExisting.user);
  return clone(authExisting);
}

async function register(payload) {
  await wait();
  const result = clone(authRegister);
  result.user.nickname = payload.nickname;
  result.user.mobile = payload.mobile;
  state.currentUser = clone(result.user);
  return result;
}

async function completeProfile(payload) {
  await wait();
  state.currentUser = Object.assign({}, state.currentUser || {}, payload, {
    id: (state.currentUser && state.currentUser.id) || "usr_789",
    profileStatus: "completed"
  });
  return {
    user: clone(state.currentUser)
  };
}

async function getMe() {
  await wait(120);
  return clone(state.currentUser || authMe);
}

async function listDevices() {
  await wait(120);
  return clone(devicesList);
}

async function bindDevice(bindingCode) {
  await wait();
  const deviceId = nextId("dev", "project");
  const newDevice = {
    id: deviceId,
    name: `KX Device ${bindingCode.slice(-4) || "0001"}`,
    onlineStatus: "online",
    model: "esp32_grbl",
    lastSeenAt: "2026-05-01T10:10:00Z"
  };
  devicesList.items.unshift(newDevice);
  state.selectedDeviceId = deviceId;
  return {
    deviceId,
    bindStatus: "bound"
  };
}

async function createProject(sourceType) {
  await wait();
  const id = nextId("prj", "project");
  const project = clone(projectDetailText);
  project.id = id;
  project.name = sourceType === "image" ? "New image project" : "New text project";
  project.sourceType = sourceType;
  project.content = {
    text: sourceType === "text" ? "" : "",
    imageAssetId: sourceType === "image" ? "ast_mock_001" : null
  };
  project.selectedDeviceId = state.selectedDeviceId;
  project.latestPreviewId = null;
  project.latestGenerationId = null;
  project.updatedAt = "2026-05-01T10:12:00Z";
  state.projects.unshift(project);
  return {
    id,
    status: "draft"
  };
}

async function listProjects() {
  await wait(120);
  return clone(state.projects);
}

async function getProject(projectId) {
  await wait(120);
  return clone(state.projects.find((item) => item.id === projectId));
}

async function saveProject(projectId, payload) {
  await wait();
  const index = state.projects.findIndex((item) => item.id === projectId);
  state.projects[index] = Object.assign({}, state.projects[index], payload, {
    updatedAt: "2026-05-01T10:20:00Z"
  });
  return clone(state.projects[index]);
}

async function createPreview(projectId) {
  await wait();
  const previewId = nextId("pre", "preview");
  const preview = clone(previewReady);
  preview.id = previewId;
  preview.status = "processing";
  preview.projectId = projectId;
  preview._polls = 0;
  state.previews[previewId] = preview;
  const project = state.projects.find((item) => item.id === projectId);
  if (project) {
    project.latestPreviewId = previewId;
    project.updatedAt = "2026-05-01T10:21:00Z";
  }
  return {
    previewId,
    status: "processing"
  };
}

async function getPreview(previewId) {
  await wait(180);
  const preview = state.previews[previewId];
  if (preview.status === "processing") {
    preview._polls += 1;
    if (preview._polls >= 1) {
      preview.status = "ready";
    }
  }
  const result = clone(preview);
  delete result._polls;
  return result;
}

async function createGeneration(projectId, previewId) {
  await wait();
  const generationId = nextId("gen", "generation");
  const generation = clone(generationReady);
  generation.id = generationId;
  generation.projectId = projectId;
  generation.previewId = previewId;
  generation.status = "processing";
  generation._polls = 0;
  state.generations[generationId] = generation;
  const project = state.projects.find((item) => item.id === projectId);
  if (project) {
    project.latestGenerationId = generationId;
    project.updatedAt = "2026-05-01T10:22:00Z";
  }
  return {
    generationId,
    status: "processing"
  };
}

async function getGeneration(generationId) {
  await wait(180);
  const generation = state.generations[generationId];
  if (generation.status === "processing") {
    generation._polls += 1;
    if (generation._polls >= 1) {
      generation.status = "ready";
    }
  }
  const result = clone(generation);
  delete result._polls;
  return result;
}

async function createJob(payload) {
  await wait();
  const jobId = nextId("job", "job");
  const job = {
    id: jobId,
    projectId: payload.projectId,
    generationId: payload.generationId,
    deviceId: payload.deviceId,
    status: "queued",
    progress: {
      percent: 0,
      currentStep: "queued"
    },
    failure: null,
    timeline: [
      { status: "queued", at: "2026-05-01T10:15:00Z" }
    ]
  };
  state.jobs.unshift(job);
  return {
    jobId,
    status: "queued"
  };
}

async function listJobs(status) {
  await wait(120);
  const items = status && status !== "all"
    ? state.jobs.filter((item) => item.status === status)
    : state.jobs;
  return {
    items: clone(items).map((item) => ({
      id: item.id,
      projectId: item.projectId,
      deviceId: item.deviceId,
      status: item.status,
      progress: item.progress,
      updatedAt: item.timeline[item.timeline.length - 1].at
    })),
    page: 1,
    pageSize: 20,
    total: items.length
  };
}

async function getJob(jobId) {
  await wait(120);
  const job = state.jobs.find((item) => item.id === jobId);
  return clone(job);
}

async function retryJob(jobId) {
  const job = state.jobs.find((item) => item.id === jobId);
  return createJob({
    projectId: job.projectId,
    generationId: job.generationId,
    deviceId: job.deviceId
  });
}

async function cancelJob(jobId) {
  await wait();
  const job = state.jobs.find((item) => item.id === jobId);
  job.status = "canceled";
  job.timeline.push({ status: "canceled", at: "2026-05-01T10:16:00Z" });
  return clone(job);
}

function setSelectedDevice(deviceId) {
  state.selectedDeviceId = deviceId;
}

module.exports = {
  wechatLogin,
  register,
  completeProfile,
  getMe,
  listDevices,
  bindDevice,
  createProject,
  listProjects,
  getProject,
  saveProject,
  createPreview,
  getPreview,
  createGeneration,
  getGeneration,
  createJob,
  listJobs,
  getJob,
  retryJob,
  cancelJob,
  setSelectedDevice,
  getSelectedDevice
};
