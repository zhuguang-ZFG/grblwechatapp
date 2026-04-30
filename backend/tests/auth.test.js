const test = require("node:test");
const assert = require("node:assert/strict");
const { createTestApp } = require("./helpers/test-app");

test("app boots with health endpoint", async () => {
  const { app } = createTestApp();
  await app.ready();

  const response = await app.inject({
    method: "GET",
    url: "/health"
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { ok: true });

  await app.close();
});

test("wechat login returns register next action for a new user", async () => {
  const { app } = createTestApp();
  await app.ready();

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/wechat-login",
    payload: {
      code: "wx_code_new",
      profile: {
        nickname: "Alice",
        avatarUrl: "https://example.com/a.png"
      }
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().nextAction, "register");

  await app.close();
});

test("register creates a completed user and returns bearer token", async () => {
  const { app } = createTestApp();
  await app.ready();

  const response = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      wechatOpenId: "openid_new",
      nickname: "Alice",
      avatarUrl: "https://example.com/a.png",
      mobile: "13800000000",
      agreeTerms: true
    }
  });

  assert.equal(response.statusCode, 200);
  assert.equal(typeof response.json().token, "string");
  assert.equal(response.json().user.profileStatus, "completed");

  await app.close();
});

test("auth guard rejects missing token on auth me", async () => {
  const { app } = createTestApp();
  await app.ready();

  const response = await app.inject({
    method: "GET",
    url: "/api/v1/auth/me"
  });

  assert.equal(response.statusCode, 401);
  assert.equal(response.json().code, "auth_required");

  await app.close();
});
