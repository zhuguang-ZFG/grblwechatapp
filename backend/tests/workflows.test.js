const test = require("node:test");
const assert = require("node:assert/strict");
const { createTestApp } = require("./helpers/test-app");

async function registerAndToken(app) {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      wechatOpenId: "openid_flow",
      nickname: "Flow User",
      avatarUrl: "",
      mobile: "13800000000",
      agreeTerms: true
    }
  });

  return response.json().token;
}

async function registerAndTokenWithOpenId(app, openId) {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      wechatOpenId: openId,
      nickname: `User-${openId}`,
      avatarUrl: "",
      mobile: "13800000000",
      agreeTerms: true
    }
  });

  return response.json().token;
}

async function createProject(app, token, overrides = {}) {
  const processParams = Object.assign(
    { speed: 1000, power: 65, passes: 1, lineSpacing: 1.2 },
    overrides.processParams || {}
  );
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/projects",
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      name: "Flow Project",
      sourceType: "text",
      selectedDeviceId: "dev_123",
      content: { text: "Best Mom", imageAssetId: null },
      layout: { widthMm: 80, heightMm: 50, rotationDeg: 0, align: "center" },
      processParams
    }
  });

  return response.json().id;
}

test("preview generation and job flow reach ready/completed states", async () => {
  const { app } = createTestApp();
  await app.ready();
  const token = await registerAndToken(app);
  const projectId = await createProject(app, token);

  const previewCreate = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/preview`,
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      forceRegenerate: true
    }
  });

  assert.equal(previewCreate.statusCode, 200);
  const previewId = previewCreate.json().previewId;

  await new Promise((resolve) => setTimeout(resolve, 80));

  const previewDetail = await app.inject({
    method: "GET",
    url: `/api/v1/previews/${previewId}`,
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(previewDetail.json().status, "ready");

  const generationCreate = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/generate`,
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      previewId
    }
  });

  const generationId = generationCreate.json().generationId;
  await new Promise((resolve) => setTimeout(resolve, 80));

  const jobCreate = await app.inject({
    method: "POST",
    url: "/api/v1/jobs",
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      projectId,
      generationId,
      deviceId: "dev_123",
      executionMode: "offline_file"
    }
  });

  const jobId = jobCreate.json().jobId;
  await new Promise((resolve) => setTimeout(resolve, 180));

  const jobDetail = await app.inject({
    method: "GET",
    url: `/api/v1/jobs/${jobId}`,
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(jobDetail.json().status, "completed");
  assert.equal(jobDetail.json().timeline.length >= 3, true);

  await app.close();
});

test("job list respects status filter for authenticated user", async () => {
  const { app } = createTestApp();
  await app.ready();
  const token = await registerAndToken(app);
  const projectId = await createProject(app, token);

  const previewCreate = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/preview`,
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      forceRegenerate: true
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 80));

  const generationCreate = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/generate`,
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      previewId: previewCreate.json().previewId
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 80));

  await app.inject({
    method: "POST",
    url: "/api/v1/jobs",
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      projectId,
      generationId: generationCreate.json().generationId,
      deviceId: "dev_123",
      executionMode: "offline_file"
    }
  });

  const failedProjectId = await createProject(app, token, {
    processParams: {
      simulateFailureCode: "DEVICE_OFFLINE"
    }
  });
  const failedPreviewCreate = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${failedProjectId}/preview`,
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      forceRegenerate: true
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 80));
  const failedGenerationCreate = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${failedProjectId}/generate`,
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      previewId: failedPreviewCreate.json().previewId
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 80));
  await app.inject({
    method: "POST",
    url: "/api/v1/jobs",
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      projectId: failedProjectId,
      generationId: failedGenerationCreate.json().generationId,
      deviceId: "dev_123",
      executionMode: "offline_file"
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 180));

  const runningList = await app.inject({
    method: "GET",
    url: "/api/v1/jobs?status=running",
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  const queuedList = await app.inject({
    method: "GET",
    url: "/api/v1/jobs?status=queued",
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  const failedDeviceCategoryList = await app.inject({
    method: "GET",
    url: "/api/v1/jobs?status=failed&failureCategory=DEVICE",
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(runningList.statusCode, 200);
  assert.equal(Array.isArray(runningList.json().items), true);
  assert.equal(Array.isArray(queuedList.json().items), true);
  assert.equal(Array.isArray(failedDeviceCategoryList.json().items), true);
  assert.equal(failedDeviceCategoryList.json().items.length >= 1, true);
  assert.equal(failedDeviceCategoryList.json().items[0].failure.category, "DEVICE");
  assert.equal(failedDeviceCategoryList.json().summary.failedByCategory.DEVICE >= 1, true);
  assert.equal(typeof failedDeviceCategoryList.json().summary.totalFailed, "number");

  await app.close();
});

test("job flow stores structured failure and retryable flag", async () => {
  const { app } = createTestApp();
  await app.ready();
  const token = await registerAndToken(app);
  const projectId = await createProject(app, token, {
    processParams: {
      simulateFailureCode: "DEVICE_OFFLINE"
    }
  });

  const previewCreate = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/preview`,
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      forceRegenerate: true
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 80));

  const generationCreate = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/generate`,
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      previewId: previewCreate.json().previewId
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 80));

  const jobCreate = await app.inject({
    method: "POST",
    url: "/api/v1/jobs",
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      projectId,
      generationId: generationCreate.json().generationId,
      deviceId: "dev_123",
      executionMode: "offline_file"
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 180));

  const jobDetail = await app.inject({
    method: "GET",
    url: `/api/v1/jobs/${jobCreate.json().jobId}`,
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(jobDetail.statusCode, 200);
  assert.equal(jobDetail.json().status, "failed");
  assert.equal(jobDetail.json().failure.code, "DEVICE_OFFLINE");
  assert.equal(jobDetail.json().failure.category, "DEVICE");
  assert.equal(jobDetail.json().failure.retryable, true);
  assert.equal(typeof jobDetail.json().failure.message, "string");

  await app.close();
});

test("retry rejects non-retryable failure target", async () => {
  const { app } = createTestApp();
  await app.ready();
  const token = await registerAndToken(app);
  const projectId = await createProject(app, token, {
    processParams: {
      simulateFailureCode: "PARAM_INVALID"
    }
  });

  const previewCreate = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/preview`,
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      forceRegenerate: true
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 80));

  const generationCreate = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/generate`,
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      previewId: previewCreate.json().previewId
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 80));

  const jobCreate = await app.inject({
    method: "POST",
    url: "/api/v1/jobs",
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      projectId,
      generationId: generationCreate.json().generationId,
      deviceId: "dev_123",
      executionMode: "offline_file"
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 180));

  const retryResponse = await app.inject({
    method: "POST",
    url: `/api/v1/jobs/${jobCreate.json().jobId}/retry`,
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(retryResponse.statusCode, 409);
  assert.equal(retryResponse.json().code, "invalid_retry_target");

  await app.close();
});

test("cancel rejects invalid terminal target", async () => {
  const { app } = createTestApp();
  await app.ready();
  const token = await registerAndToken(app);
  const projectId = await createProject(app, token);

  const previewCreate = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/preview`,
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      forceRegenerate: true
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 80));

  const generationCreate = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/generate`,
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      previewId: previewCreate.json().previewId
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 80));

  const jobCreate = await app.inject({
    method: "POST",
    url: "/api/v1/jobs",
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      projectId,
      generationId: generationCreate.json().generationId,
      deviceId: "dev_123",
      executionMode: "offline_file"
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 180));

  const cancelResponse = await app.inject({
    method: "POST",
    url: `/api/v1/jobs/${jobCreate.json().jobId}/cancel`,
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(cancelResponse.statusCode, 409);
  assert.equal(cancelResponse.json().code, "invalid_cancel_target");

  await app.close();
});

test("job endpoints reject cross-user access", async () => {
  const { app } = createTestApp();
  await app.ready();
  const ownerToken = await registerAndTokenWithOpenId(app, "openid_owner");
  const attackerToken = await registerAndTokenWithOpenId(app, "openid_attacker");
  const projectId = await createProject(app, ownerToken);

  const previewCreate = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/preview`,
    headers: {
      authorization: `Bearer ${ownerToken}`
    },
    payload: {
      forceRegenerate: true
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 80));

  const generationCreate = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/generate`,
    headers: {
      authorization: `Bearer ${ownerToken}`
    },
    payload: {
      previewId: previewCreate.json().previewId
    }
  });
  await new Promise((resolve) => setTimeout(resolve, 80));

  const jobCreate = await app.inject({
    method: "POST",
    url: "/api/v1/jobs",
    headers: {
      authorization: `Bearer ${ownerToken}`
    },
    payload: {
      projectId,
      generationId: generationCreate.json().generationId,
      deviceId: "dev_123",
      executionMode: "offline_file"
    }
  });
  const jobId = jobCreate.json().jobId;

  const detailByAttacker = await app.inject({
    method: "GET",
    url: `/api/v1/jobs/${jobId}`,
    headers: {
      authorization: `Bearer ${attackerToken}`
    }
  });
  assert.equal(detailByAttacker.statusCode, 404);
  assert.equal(detailByAttacker.json().code, "job_not_found");

  const cancelByAttacker = await app.inject({
    method: "POST",
    url: `/api/v1/jobs/${jobId}/cancel`,
    headers: {
      authorization: `Bearer ${attackerToken}`
    }
  });
  assert.equal(cancelByAttacker.statusCode, 404);
  assert.equal(cancelByAttacker.json().code, "job_not_found");

  const retryByAttacker = await app.inject({
    method: "POST",
    url: `/api/v1/jobs/${jobId}/retry`,
    headers: {
      authorization: `Bearer ${attackerToken}`
    }
  });
  assert.equal(retryByAttacker.statusCode, 404);
  assert.equal(retryByAttacker.json().code, "job_not_found");

  await app.close();
});
