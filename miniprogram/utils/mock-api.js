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

const systemMachineProfiles = [
  {
    id: "mp_123",
    name: "Default ESP32 GRBL",
    deviceModel: "esp32_grbl",
    workArea: { widthMm: 400, heightMm: 400 },
    originMode: "bottom_left",
    supportsOfflinePrint: true,
    defaultParams: { speed: 1200, power: 70, lineSpacing: 1.0 },
    isSystem: true
  },
  {
    id: "mp_124",
    name: "Precision Mode",
    deviceModel: "esp32_grbl",
    workArea: { widthMm: 400, heightMm: 400 },
    originMode: "center",
    supportsOfflinePrint: true,
    defaultParams: { speed: 600, power: 50, lineSpacing: 0.8 },
    isSystem: true
  }
];

const systemMaterialProfiles = [
  {
    id: "mat_123",
    name: "Wood - Light Burn",
    category: "wood",
    recommendedParams: { speed: 1000, power: 65, passes: 1 },
    notes: "Good for shallow marking on soft wood.",
    isSystem: true
  },
  {
    id: "mat_124",
    name: "Wood - Deep Engrave",
    category: "wood",
    recommendedParams: { speed: 500, power: 85, passes: 2 },
    notes: "For deep engraving on hardwood.",
    isSystem: true
  },
  {
    id: "mat_125",
    name: "Acrylic - Cutting",
    category: "acrylic",
    recommendedParams: { speed: 300, power: 90, passes: 3 },
    notes: "Cut through 3mm acrylic.",
    isSystem: true
  },
  {
    id: "mat_126",
    name: "Leather - Marking",
    category: "leather",
    recommendedParams: { speed: 1500, power: 40, passes: 1 },
    notes: "Light marking on genuine leather.",
    isSystem: true
  }
];

const systemTemplates = [
  {
    id: "tpl_001",
    name: "母亲节纪念牌",
    description: "典雅的中文排版，适合母亲节礼物雕刻，预设了心形装饰文本布局。",
    sourceType: "text",
    category: "礼品",
    isSystem: true,
    content: { text: "妈妈\n我爱您", fontId: "fnt_001", fontSize: 120, lineGap: 20, imageAssetId: null, processorPresetId: null },
    layout: { widthMm: 100, heightMm: 70, rotationDeg: 0, align: "center" },
    processParams: { speed: 800, power: 70, passes: 1, lineSpacing: 0.8 },
    previewImageUrl: ""
  },
  {
    id: "tpl_002",
    name: "店铺招牌",
    description: "加粗醒目的店铺名称排版，适合木质或亚克力招牌雕刻。",
    sourceType: "text",
    category: "标牌",
    isSystem: true,
    content: { text: "欢迎光临", fontId: "fnt_005", fontSize: 150, lineGap: 0, imageAssetId: null, processorPresetId: null },
    layout: { widthMm: 200, heightMm: 80, rotationDeg: 0, align: "center" },
    processParams: { speed: 600, power: 80, passes: 2, lineSpacing: 1.0 },
    previewImageUrl: ""
  },
  {
    id: "tpl_003",
    name: "名言书签",
    description: "细长的书签尺寸，楷体排版名言警句，适合皮质或木质书签。",
    sourceType: "text",
    category: "工艺",
    isSystem: true,
    content: { text: "学而不思则罔", fontId: "fnt_002", fontSize: 80, lineGap: 10, imageAssetId: null, processorPresetId: null },
    layout: { widthMm: 40, heightMm: 120, rotationDeg: 0, align: "center" },
    processParams: { speed: 1000, power: 60, passes: 1, lineSpacing: 0.6 },
    previewImageUrl: ""
  },
  {
    id: "tpl_004",
    name: "皮具定制Logo",
    description: "图片转雕刻预设，适合在皮革表面雕刻品牌标志或图案。",
    sourceType: "image",
    category: "礼品",
    isSystem: true,
    content: { text: "", imageAssetId: null, fontId: "fnt_001", fontSize: 100, lineGap: 0, processorPresetId: "ip_002" },
    layout: { widthMm: 60, heightMm: 60, rotationDeg: 0, align: "center" },
    processParams: { speed: 1500, power: 40, passes: 1, lineSpacing: 1.0 },
    previewImageUrl: ""
  },
  {
    id: "tpl_005",
    name: "装饰画心形图案",
    description: "心形图片轮廓雕刻，适合木板或亚克力装饰画制作。",
    sourceType: "image",
    category: "工艺",
    isSystem: true,
    content: { text: "", imageAssetId: null, fontId: "fnt_001", fontSize: 100, lineGap: 0, processorPresetId: "ip_001" },
    layout: { widthMm: 150, heightMm: 150, rotationDeg: 0, align: "center" },
    processParams: { speed: 800, power: 75, passes: 1, lineSpacing: 1.0 },
    previewImageUrl: ""
  },
  {
    id: "tpl_006",
    name: "亚克力标识牌",
    description: "边缘检测图片处理预设，适合亚克力板材的标识牌制作。",
    sourceType: "image",
    category: "标牌",
    isSystem: true,
    content: { text: "", imageAssetId: null, fontId: "fnt_001", fontSize: 100, lineGap: 0, processorPresetId: "ip_003" },
    layout: { widthMm: 180, heightMm: 100, rotationDeg: 0, align: "center" },
    processParams: { speed: 300, power: 90, passes: 3, lineSpacing: 1.0 },
    previewImageUrl: ""
  }
];

const projectDetailText = {
  id: "prj_123",
  name: "Mother's Day plaque",
  sourceType: "text",
  selectedDeviceId: "dev_123",
  machineProfileId: "mp_123",
  materialProfileId: "mat_123",
  content: {
    text: "Best Mom",
    imageAssetId: null,
    fontId: "fnt_001",
    fontSize: 100,
    lineGap: 0,
    processorPresetId: null
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

const fontsList = {
  items: [
    {
      id: "fnt_001",
      name: "默认黑体",
      family: "sans-serif",
      style: "regular",
      category: "sans-serif",
      previewUrl: ""
    },
    {
      id: "fnt_002",
      name: "楷体",
      family: "KaiTi",
      style: "regular",
      category: "serif",
      previewUrl: ""
    },
    {
      id: "fnt_003",
      name: "宋体",
      family: "SimSun",
      style: "regular",
      category: "serif",
      previewUrl: ""
    },
    {
      id: "fnt_004",
      name: "仿宋",
      family: "FangSong",
      style: "regular",
      category: "serif",
      previewUrl: ""
    },
    {
      id: "fnt_005",
      name: "粗体黑体",
      family: "sans-serif",
      style: "bold",
      category: "sans-serif",
      previewUrl: ""
    },
    {
      id: "fnt_006",
      name: "圆体",
      family: "sans-serif",
      style: "round",
      category: "sans-serif",
      previewUrl: ""
    }
  ]
};

const imageProcessorsList = {
  items: [
    {
      id: "ip_001",
      name: "标准",
      type: "base",
      defaultParams: { threshold: 128, noiseReduction: 0 }
    },
    {
      id: "ip_002",
      name: "边缘检测",
      type: "edge",
      defaultParams: { threshold: 80, noiseReduction: 1 }
    },
    {
      id: "ip_003",
      name: "中心线",
      type: "centerline",
      defaultParams: { threshold: 100, noiseReduction: 2 }
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
  userTemplates: [],
  userMachineProfiles: [],
  userMaterialProfiles: [],
  counters: {
    project: 200,
    preview: 200,
    generation: 200,
    job: 200,
    template: 100,
    profile: 100
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

async function listMachineProfiles() {
  await wait(80);
  const allItems = systemMachineProfiles.concat(state.userMachineProfiles);
  return { items: clone(allItems) };
}

async function listMaterialProfiles() {
  await wait(80);
  const allItems = systemMaterialProfiles.concat(state.userMaterialProfiles);
  return { items: clone(allItems) };
}

async function listFonts() {
  await wait(80);
  return clone(fontsList);
}

async function listImageProcessors() {
  await wait(80);
  return clone(imageProcessorsList);
}

async function getDashboardStats() {
  await wait(80);
  const failedCount = state.jobs.filter((j) => j.status === "failed").length;
  const completedCount = state.jobs.filter((j) => j.status === "completed").length;
  return {
    projectCount: state.projects.length,
    jobCounts: { queued: 1, dispatching: 0, running: 1, completed: completedCount, failed: failedCount, canceled: 0 },
    deviceCount: 1,
    totalJobs: state.jobs.length
  };
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

async function createProject(sourceType, selectedDeviceId) {
  await wait();
  const id = nextId("prj", "project");
  const project = clone(projectDetailText);
  project.id = id;
  project.name = sourceType === "image" ? "New image project" : "New text project";
  project.sourceType = sourceType;
  project.content = {
    text: sourceType === "text" ? "" : "",
    imageAssetId: sourceType === "image" ? "ast_mock_001" : null,
    fontId: "fnt_001",
    fontSize: 100,
    lineGap: 0,
    processorPresetId: sourceType === "image" ? "ip_001" : null
  };
  project.selectedDeviceId = selectedDeviceId || state.selectedDeviceId;
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

async function duplicateProject(projectId) {
  await wait();
  const project = state.projects.find((item) => item.id === projectId);
  const duplicated = clone(project);
  duplicated.id = nextId("prj", "project");
  duplicated.name = `${project.name} Copy`;
  duplicated.updatedAt = "2026-05-01T10:20:30Z";
  state.projects.unshift(duplicated);
  return clone(duplicated);
}

async function archiveProject(projectId) {
  await wait();
  const project = state.projects.find((item) => item.id === projectId);
  if (project) {
    project.status = "archived";
    project.updatedAt = "2026-05-01T10:21:00Z";
  }
  return clone(project || { id: projectId, status: "archived" });
}

async function restoreProject(projectId) {
  await wait();
  const project = state.projects.find((item) => item.id === projectId);
  if (project) {
    project.status = "draft";
    project.updatedAt = "2026-05-01T10:21:30Z";
  }
  return clone(project || { id: projectId, status: "draft" });
}

async function deleteProject(projectId) {
  await wait();
  const index = state.projects.findIndex((item) => item.id === projectId);
  if (index >= 0) {
    state.projects.splice(index, 1);
  }
  return {
    id: projectId,
    deleted: true
  };
}

async function uploadImage(projectId, tempFilePath) {
  await wait();
  const assetId = `ast_${Date.now()}`;
  return { assetId, assetUrl: `/storage/assets/${assetId}.png` };
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

async function listTemplates(category) {
  await wait(80);
  const allItems = systemTemplates.concat(state.userTemplates);
  const items = category
    ? allItems.filter((item) => item.category === category)
    : allItems;
  return { items: clone(items) };
}

async function getTemplate(templateId) {
  await wait(80);
  const fromSystem = systemTemplates.find((item) => item.id === templateId);
  if (fromSystem) return clone(fromSystem);
  const fromUser = state.userTemplates.find((item) => item.id === templateId);
  return fromUser ? clone(fromUser) : null;
}

async function createTemplate(payload) {
  await wait();
  const id = nextId("tpl", "template");
  const template = {
    id,
    name: payload.name || "自定义模板",
    description: payload.description || "",
    sourceType: payload.sourceType || "text",
    category: payload.category || "自定义",
    isSystem: false,
    content: payload.content || { text: "", imageAssetId: null, fontId: "fnt_001", fontSize: 100, lineGap: 0, processorPresetId: null },
    layout: payload.layout || { widthMm: 80, heightMm: 50, rotationDeg: 0, align: "center" },
    processParams: payload.processParams || { speed: 1000, power: 65, passes: 1, lineSpacing: 1.0 },
    previewImageUrl: ""
  };
  state.userTemplates.unshift(template);
  return clone(template);
}

async function updateTemplate(templateId, payload) {
  await wait(80);
  const index = state.userTemplates.findIndex((item) => item.id === templateId);
  if (index < 0) return null;
  const tmpl = state.userTemplates[index];
  if (payload.name !== undefined) tmpl.name = payload.name;
  if (payload.description !== undefined) tmpl.description = payload.description;
  if (payload.category !== undefined) tmpl.category = payload.category;
  state.userTemplates[index] = tmpl;
  return clone(tmpl);
}

async function deleteTemplate(templateId) {
  await wait(80);
  const index = state.userTemplates.findIndex((item) => item.id === templateId);
  if (index < 0) return null;
  state.userTemplates.splice(index, 1);
  return { deleted: true };
}

async function applyTemplate(templateId) {
  await wait();
  const fromSystem = systemTemplates.find((item) => item.id === templateId);
  const fromUser = state.userTemplates.find((item) => item.id === templateId);
  const template = fromSystem || fromUser;
  if (!template) return null;

  const id = nextId("prj", "project");
  const project = clone(projectDetailText);
  project.id = id;
  project.name = template.name;
  project.sourceType = template.sourceType;
  project.content = clone(template.content);
  project.layout = clone(template.layout);
  project.processParams = clone(template.processParams);
  project.latestPreviewId = null;
  project.latestGenerationId = null;
  project.updatedAt = "2026-05-01T10:25:00Z";
  state.projects.unshift(project);
  return { id, status: "draft" };
}

async function getMachineProfile(profileId) {
  await wait(80);
  const fromSystem = systemMachineProfiles.find((item) => item.id === profileId);
  if (fromSystem) return clone(fromSystem);
  const fromUser = state.userMachineProfiles.find((item) => item.id === profileId);
  return fromUser ? clone(fromUser) : null;
}

async function getMaterialProfile(profileId) {
  await wait(80);
  const fromSystem = systemMaterialProfiles.find((item) => item.id === profileId);
  if (fromSystem) return clone(fromSystem);
  const fromUser = state.userMaterialProfiles.find((item) => item.id === profileId);
  return fromUser ? clone(fromUser) : null;
}

async function createMachineProfile(payload) {
  await wait();
  const id = nextId("mp", "profile");
  const profile = {
    id,
    name: payload.name || "自定义配置",
    deviceModel: payload.deviceModel || "esp32_grbl",
    workArea: {
      widthMm: payload.workAreaWidthMm || 400,
      heightMm: payload.workAreaHeightMm || 400
    },
    originMode: payload.originMode || "bottom_left",
    supportsOfflinePrint: payload.supportsOfflinePrint !== undefined ? payload.supportsOfflinePrint : true,
    defaultParams: {
      speed: payload.defaultSpeed || 1200,
      power: payload.defaultPower || 70,
      lineSpacing: payload.defaultLineSpacing || 1.0
    },
    isSystem: false
  };
  state.userMachineProfiles.push(profile);
  return clone(profile);
}

async function updateMachineProfile(profileId, payload) {
  await wait(80);
  const profile = state.userMachineProfiles.find((item) => item.id === profileId);
  if (!profile) return null;
  if (payload.name !== undefined) profile.name = payload.name;
  if (payload.workAreaWidthMm !== undefined) profile.workArea.widthMm = payload.workAreaWidthMm;
  if (payload.workAreaHeightMm !== undefined) profile.workArea.heightMm = payload.workAreaHeightMm;
  if (payload.originMode !== undefined) profile.originMode = payload.originMode;
  if (payload.defaultSpeed !== undefined) profile.defaultParams.speed = payload.defaultSpeed;
  if (payload.defaultPower !== undefined) profile.defaultParams.power = payload.defaultPower;
  if (payload.defaultLineSpacing !== undefined) profile.defaultParams.lineSpacing = payload.defaultLineSpacing;
  return clone(profile);
}

async function deleteMachineProfile(profileId) {
  await wait(80);
  const index = state.userMachineProfiles.findIndex((item) => item.id === profileId);
  if (index < 0) return null;
  state.userMachineProfiles.splice(index, 1);
  return { deleted: true };
}

async function createMaterialProfile(payload) {
  await wait();
  const id = nextId("mat", "profile");
  const profile = {
    id,
    name: payload.name || "自定义材质",
    category: payload.category || "自定义",
    recommendedParams: {
      speed: payload.recommendedSpeed || 1000,
      power: payload.recommendedPower || 65,
      passes: payload.recommendedPasses || 1
    },
    notes: payload.notes || "",
    isSystem: false
  };
  state.userMaterialProfiles.push(profile);
  return clone(profile);
}

async function updateMaterialProfile(profileId, payload) {
  await wait(80);
  const profile = state.userMaterialProfiles.find((item) => item.id === profileId);
  if (!profile) return null;
  if (payload.name !== undefined) profile.name = payload.name;
  if (payload.category !== undefined) profile.category = payload.category;
  if (payload.recommendedSpeed !== undefined) profile.recommendedParams.speed = payload.recommendedSpeed;
  if (payload.recommendedPower !== undefined) profile.recommendedParams.power = payload.recommendedPower;
  if (payload.recommendedPasses !== undefined) profile.recommendedParams.passes = payload.recommendedPasses;
  if (payload.notes !== undefined) profile.notes = payload.notes;
  return clone(profile);
}

async function deleteMaterialProfile(profileId) {
  await wait(80);
  const index = state.userMaterialProfiles.findIndex((item) => item.id === profileId);
  if (index < 0) return null;
  state.userMaterialProfiles.splice(index, 1);
  return { deleted: true };
}

function setSelectedDevice(device) {
  if (!device) {
    return;
  }
  state.selectedDeviceId = typeof device === "string" ? device : device.id;
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
  duplicateProject,
  archiveProject,
  restoreProject,
  deleteProject,
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
  getSelectedDevice,
  uploadImage,
  getDashboardStats,
  listMachineProfiles,
  listMaterialProfiles,
  listFonts,
  listImageProcessors,
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  applyTemplate,
  getMachineProfile,
  createMachineProfile,
  updateMachineProfile,
  deleteMachineProfile,
  getMaterialProfile,
  createMaterialProfile,
  updateMaterialProfile,
  deleteMaterialProfile
};
