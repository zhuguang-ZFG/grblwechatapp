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

  assert.equal(created.statusCode, 201);
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

test("second user cannot re-bind an already bound device", async () => {
  const { app } = createTestApp();
  await app.ready();
  const userAToken = await registerAndTokenWithOpenId(app, "openid_bind_a");

  const bindA = await app.inject({
    method: "POST",
    url: "/api/v1/devices/bind",
    headers: { authorization: `Bearer ${userAToken}` },
    payload: { bindingCode: "ABCD1234" }
  });
  assert.equal(bindA.statusCode, 200);
  assert.equal(bindA.json().bindStatus, "bound");

  // User B tries to re-bind the same device
  const userBToken = await registerAndTokenWithOpenId(app, "openid_bind_b");
  const bindB = await app.inject({
    method: "POST",
    url: "/api/v1/devices/bind",
    headers: { authorization: `Bearer ${userBToken}` },
    payload: { bindingCode: "ABCD1234" }
  });
  assert.equal(bindB.statusCode, 409);
  assert.equal(bindB.json().code, "device_already_bound");

  // User A's bind is still intact
  const devicesA = await app.inject({
    method: "GET",
    url: "/api/v1/devices",
    headers: { authorization: `Bearer ${userAToken}` }
  });
  assert.equal(devicesA.json().items.some((d) => d.id === "dev_123"), true);

  await app.close();
});

test("device list scoped to bound user", async () => {
  const { app } = createTestApp();
  await app.ready();

  // Both devices initially have owner_user_id='' in seed data

  // User A binds dev_123
  const tokenA = await registerAndTokenWithOpenId(app, "openid_scope_a");
  await app.inject({
    method: "POST",
    url: "/api/v1/devices/bind",
    headers: { authorization: `Bearer ${tokenA}` },
    payload: { bindingCode: "ABCD1234" }
  });

  // User A sees dev_123 (owned) + dev_124 (unbound) = 2
  const listA = await app.inject({
    method: "GET",
    url: "/api/v1/devices",
    headers: { authorization: `Bearer ${tokenA}` }
  });
  assert.equal(listA.json().items.length, 2);
  assert.equal(listA.json().items.some((d) => d.id === "dev_123"), true);

  // User B — only sees dev_124 (unbound), NOT dev_123 (bound by A)
  const tokenB = await registerAndTokenWithOpenId(app, "openid_scope_b");
  const listB = await app.inject({
    method: "GET",
    url: "/api/v1/devices",
    headers: { authorization: `Bearer ${tokenB}` }
  });
  assert.equal(listB.json().items.length, 1);
  assert.equal(listB.json().items[0].id, "dev_124");

  await app.close();
});

test("duplicate archive restore and delete project lifecycle", async () => {
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

  const restored = await app.inject({
    method: "POST",
    url: `/api/v1/projects/${projectId}/restore`,
    headers: {
      authorization: `Bearer ${token}`
    }
  });
  assert.equal(restored.statusCode, 200);
  assert.equal(restored.json().status, "draft");

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
