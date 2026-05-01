const fs = require("fs");
const os = require("os");
const path = require("path");
const { buildApp } = require("../backend/src/app");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

async function waitPreviewReady(app, token, previewId) {
  for (let i = 0; i < 20; i += 1) {
    const response = await app.inject({
      method: "GET",
      url: `/api/v1/previews/${previewId}`,
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    if (response.statusCode === 200 && response.json().status === "ready") {
      return;
    }
    await sleep(50);
  }
  throw new Error("Preview did not become ready in time");
}

async function run() {
  const rootDir = makeTempDir("kxapp-gateway-ack-smoke-");
  const app = buildApp({
    env: {
      port: 0,
      host: "127.0.0.1",
      databaseFile: path.join(rootDir, "smoke.db"),
      storageDir: path.join(rootDir, "storage")
    }
  });

  try {
    await app.ready();

    const register = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: {
        wechatOpenId: `openid_smoke_${Date.now()}`,
        nickname: "Smoke User",
        avatarUrl: "",
        mobile: "13800000000",
        agreeTerms: true
      }
    });
    if (register.statusCode !== 200) {
      throw new Error(`Register failed: ${register.statusCode}`);
    }
    const token = register.json().token;

    const bind = await app.inject({
      method: "POST",
      url: "/api/v1/devices/bind",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        bindingCode: "ABCD1234"
      }
    });
    if (bind.statusCode !== 200) {
      throw new Error(`Bind failed: ${bind.statusCode}`);
    }
    const { deviceId, deviceToken } = bind.json();

    const projectCreate = await app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        name: "Gateway ACK Smoke",
        sourceType: "text",
        selectedDeviceId: deviceId,
        content: { text: "Smoke", imageAssetId: null },
        layout: { widthMm: 80, heightMm: 50, rotationDeg: 0, align: "center" },
        processParams: { speed: 1000, power: 65, passes: 1, lineSpacing: 1.2 }
      }
    });
    if (projectCreate.statusCode !== 201) {
      throw new Error(`Project create failed: ${projectCreate.statusCode}`);
    }
    const projectId = projectCreate.json().id;

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
    if (previewCreate.statusCode !== 201) {
      throw new Error(`Preview create failed: ${previewCreate.statusCode}`);
    }
    const previewId = previewCreate.json().previewId;
    await waitPreviewReady(app, token, previewId);

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
    if (generationCreate.statusCode !== 201) {
      throw new Error(`Generation create failed: ${generationCreate.statusCode}`);
    }
    const generationId = generationCreate.json().generationId;
    await sleep(100);

    const heartbeat = await app.inject({
      method: "POST",
      url: "/api/v1/gateway/heartbeat",
      payload: {
        deviceId,
        deviceToken
      }
    });
    if (heartbeat.statusCode !== 200) {
      throw new Error(`Heartbeat failed: ${heartbeat.statusCode}`);
    }

    const jobCreate = await app.inject({
      method: "POST",
      url: "/api/v1/jobs",
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        projectId,
        generationId,
        deviceId,
        executionMode: "offline_file"
      }
    });
    if (jobCreate.statusCode !== 201) {
      throw new Error(`Job create failed: ${jobCreate.statusCode}`);
    }
    const jobId = jobCreate.json().jobId;

    const pending = await app.inject({
      method: "GET",
      url: `/api/v1/gateway/jobs/pending?deviceId=${deviceId}&deviceToken=${deviceToken}`
    });
    if (pending.statusCode !== 200 || !pending.json().pending || pending.json().job.jobId !== jobId) {
      throw new Error("Pending poll did not return expected job");
    }

    const running = await app.inject({
      method: "POST",
      url: "/api/v1/gateway/jobs/progress",
      payload: {
        deviceId,
        deviceToken,
        jobId,
        status: "running",
        percent: 55,
        currentStep: "smoke-running"
      }
    });
    if (running.statusCode !== 200) {
      throw new Error(`Running progress failed: ${running.statusCode}`);
    }

    const completed = await app.inject({
      method: "POST",
      url: "/api/v1/gateway/jobs/progress",
      payload: {
        deviceId,
        deviceToken,
        jobId,
        status: "completed",
        percent: 100,
        currentStep: "smoke-completed"
      }
    });
    if (completed.statusCode !== 200) {
      throw new Error(`Completed progress failed: ${completed.statusCode}`);
    }

    const jobDetail = await app.inject({
      method: "GET",
      url: `/api/v1/jobs/${jobId}`,
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    if (jobDetail.statusCode !== 200 || jobDetail.json().status !== "completed") {
      throw new Error("Job did not reach completed status");
    }

    const pendingAfter = await app.inject({
      method: "GET",
      url: `/api/v1/gateway/jobs/pending?deviceId=${deviceId}&deviceToken=${deviceToken}`
    });
    if (pendingAfter.statusCode !== 200 || pendingAfter.json().pending !== false) {
      throw new Error("Pending queue was not cleared after ACK flow");
    }

    console.log(`Gateway ACK smoke passed. jobId=${jobId} deviceId=${deviceId}`);
  } finally {
    await app.close();
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
