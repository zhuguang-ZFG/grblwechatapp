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

async function createProject(app, token) {
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
      processParams: { speed: 1000, power: 65, passes: 1, lineSpacing: 1.2 }
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
