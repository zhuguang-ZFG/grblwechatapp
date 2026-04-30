const test = require("node:test");
const assert = require("node:assert/strict");
const { createTestApp } = require("./helpers/test-app");

async function registerAndToken(app) {
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      wechatOpenId: "openid_project",
      nickname: "Project User",
      avatarUrl: "",
      mobile: "13800000000",
      agreeTerms: true
    }
  });

  return response.json().token;
}

test("list devices returns seeded devices for authenticated user", async () => {
  const { app } = createTestApp();
  await app.ready();
  const token = await registerAndToken(app);

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/devices",
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(Array.isArray(response.json().items), true);
  assert.equal(response.json().items.length >= 2, true);

  await app.close();
});

test("create and fetch project persists project data", async () => {
  const { app } = createTestApp();
  await app.ready();
  const token = await registerAndToken(app);

  const created = await app.inject({
    method: "POST",
    url: "/api/v1/projects",
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      name: "Plaque",
      sourceType: "text",
      selectedDeviceId: "dev_123",
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
      }
    }
  });

  assert.equal(created.statusCode, 200);
  const projectId = created.json().id;

  const fetched = await app.inject({
    method: "GET",
    url: `/api/v1/projects/${projectId}`,
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  assert.equal(fetched.statusCode, 200);
  assert.equal(fetched.json().name, "Plaque");
  assert.equal(fetched.json().sourceType, "text");

  await app.close();
});

test("bind device marks device as bound for current user", async () => {
  const { app } = createTestApp();
  await app.ready();
  const token = await registerAndToken(app);

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/devices/bind",
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      bindingCode: "EFGH5678"
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().bindStatus, "bound");

  const devices = await app.inject({
    method: "GET",
    url: "/api/v1/devices",
    headers: {
      authorization: `Bearer ${token}`
    }
  });

  const bound = devices.json().items.find((item) => item.id === response.json().deviceId);
  assert.equal(bound.bindStatus, "bound");
  assert.equal(bound.onlineStatus, "online");

  await app.close();
});

test("duplicate archive and delete project lifecycle", async () => {
  const { app } = createTestApp();
  await app.ready();
  const token = await registerAndToken(app);

  const created = await app.inject({
    method: "POST",
    url: "/api/v1/projects",
    headers: {
      authorization: `Bearer ${token}`
    },
    payload: {
      name: "Original Project",
      sourceType: "text",
      selectedDeviceId: "dev_123",
      content: {
        text: "Original",
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
      }
    }
  });
  const projectId = created.json().id;

  const duplicated = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/duplicate`,
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  assert.equal(duplicated.statusCode, 200);
  assert.equal(duplicated.json().name.includes("Copy"), true);
  assert.equal(duplicated.json().sourceType, "text");

  const archived = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/archive`,
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  assert.equal(archived.statusCode, 200);
  assert.equal(archived.json().status, "archived");

  const deleted = await app.inject({
    method: "DELETE",
    url: `/api/v1/projects/${projectId}`,
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  assert.equal(deleted.statusCode, 200);
  assert.equal(deleted.json().deleted, true);

  const fetched = await app.inject({
    method: "GET",
    url: `/api/v1/projects/${projectId}`,
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  assert.equal(fetched.statusCode, 404);

  await app.close();
});
