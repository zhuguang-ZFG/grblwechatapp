# KXApp Backend P0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Fastify backend that replaces the current mock-only frontend dependency with real auth, project, preview, generation, and job APIs for the P0 mini program loop.

**Architecture:** Add a single `backend/` Node.js service with Fastify routes, SQLite persistence, local artifact storage, and in-process fake workers for preview, generation, and job state transitions. Keep the API contract aligned with the existing mini program service adapter so the frontend can switch from mock mode to real mode with minimal changes.

**Tech Stack:** Node.js, Fastify, better-sqlite3, built-in `node:test`, SQLite, local filesystem storage

---

## File Structure

- Create: `backend/package.json`
- Create: `backend/src/server.js`
- Create: `backend/src/app.js`
- Create: `backend/src/config/env.js`
- Create: `backend/src/shared/db/index.js`
- Create: `backend/src/shared/db/schema.js`
- Create: `backend/src/shared/session/token-store.js`
- Create: `backend/src/shared/storage/artifact-store.js`
- Create: `backend/src/shared/http/auth-guard.js`
- Create: `backend/src/shared/http/error-response.js`
- Create: `backend/src/modules/auth/routes.js`
- Create: `backend/src/modules/auth/service.js`
- Create: `backend/src/modules/devices/routes.js`
- Create: `backend/src/modules/devices/service.js`
- Create: `backend/src/modules/projects/routes.js`
- Create: `backend/src/modules/projects/service.js`
- Create: `backend/src/modules/previews/routes.js`
- Create: `backend/src/modules/previews/service.js`
- Create: `backend/src/modules/generations/routes.js`
- Create: `backend/src/modules/generations/service.js`
- Create: `backend/src/modules/jobs/routes.js`
- Create: `backend/src/modules/jobs/service.js`
- Create: `backend/src/workers/runtime.js`
- Create: `backend/src/workers/tasks.js`
- Create: `backend/src/seeds/devices.js`
- Create: `backend/tests/helpers/test-app.js`
- Create: `backend/tests/auth.test.js`
- Create: `backend/tests/projects.test.js`
- Create: `backend/tests/workflows.test.js`
- Modify later: `miniprogram/config/env.js`

## Task 1: Scaffold the backend runtime

**Files:**
- Create: `backend/package.json`
- Create: `backend/src/server.js`
- Create: `backend/src/app.js`
- Create: `backend/src/config/env.js`
- Test: `backend/package.json`

- [ ] **Step 1: Write the failing package scaffold expectation**

Create `backend/package.json` with this minimal script skeleton:

```json
{
  "name": "kxapp-backend",
  "version": "0.1.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "dev": "node src/server.js",
    "test": "node --test tests/*.test.js"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

- [ ] **Step 2: Run package script check to verify it fails**

Run: `node backend/src/server.js`

Expected: FAIL with `Cannot find module` because `src/server.js` does not exist yet.

- [ ] **Step 3: Write minimal backend runtime files**

Create `backend/package.json`:

```json
{
  "name": "kxapp-backend",
  "version": "0.1.0",
  "private": true,
  "type": "commonjs",
  "scripts": {
    "dev": "node src/server.js",
    "test": "node --test tests/*.test.js"
  },
  "dependencies": {
    "better-sqlite3": "^11.7.0",
    "fastify": "^5.2.1"
  }
}
```

Create `backend/src/config/env.js`:

```js
const path = require("path");

module.exports = {
  port: Number(process.env.PORT || 3100),
  host: process.env.HOST || "127.0.0.1",
  databaseFile: process.env.DATABASE_FILE || path.join(__dirname, "../../data/kxapp.db"),
  storageDir: process.env.STORAGE_DIR || path.join(__dirname, "../../storage")
};
```

Create `backend/src/app.js`:

```js
const Fastify = require("fastify");

function buildApp(options = {}) {
  const app = Fastify({
    logger: false
  });

  app.get("/health", async () => ({
    ok: true
  }));

  return app;
}

module.exports = {
  buildApp
};
```

Create `backend/src/server.js`:

```js
const { buildApp } = require("./app");
const env = require("./config/env");

async function start() {
  const app = buildApp();
  await app.listen({
    port: env.port,
    host: env.host
  });
  console.log(`kxapp-backend listening on http://${env.host}:${env.port}`);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Workdir: `backend`

Expected: packages installed, `package-lock.json` created.

- [ ] **Step 5: Run the backend entrypoint to verify it passes**

Run: `node src/server.js`

Workdir: `backend`

Expected: prints `kxapp-backend listening on http://127.0.0.1:3100`

- [ ] **Step 6: Commit**

Run:

```bash
git add backend/package.json backend/package-lock.json backend/src/server.js backend/src/app.js backend/src/config/env.js
git commit -m "feat: scaffold backend runtime"
```

## Task 2: Add SQLite bootstrap and shared infrastructure

**Files:**
- Create: `backend/src/shared/db/index.js`
- Create: `backend/src/shared/db/schema.js`
- Create: `backend/src/shared/storage/artifact-store.js`
- Create: `backend/src/seeds/devices.js`
- Modify: `backend/src/app.js`
- Test: `backend/tests/helpers/test-app.js`

- [ ] **Step 1: Write the failing test for app boot with database**

Create `backend/tests/helpers/test-app.js`:

```js
const path = require("path");
const fs = require("fs");
const os = require("os");
const { buildApp } = require("../../src/app");

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function createTestApp() {
  const rootDir = makeTempDir("kxapp-backend-");
  const app = buildApp({
    env: {
      port: 0,
      host: "127.0.0.1",
      databaseFile: path.join(rootDir, "test.db"),
      storageDir: path.join(rootDir, "storage")
    }
  });

  return {
    app,
    rootDir
  };
}

module.exports = {
  createTestApp
};
```

Create `backend/tests/auth.test.js` with the first health/database check:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/auth.test.js`

Workdir: `backend`

Expected: FAIL because `buildApp` does not yet support `options.env` or DB initialization.

- [ ] **Step 3: Write minimal shared DB and storage infrastructure**

Create `backend/src/seeds/devices.js`:

```js
module.exports = [
  {
    id: "dev_123",
    name: "KX Laser A1",
    model: "esp32_grbl",
    serial_no: "KX-A1-0001",
    bind_status: "bound",
    online_status: "online",
    binding_code: "ABCD1234",
    last_seen_at: "2026-05-01T10:08:00Z"
  },
  {
    id: "dev_124",
    name: "KX Laser B2",
    model: "esp32_grbl",
    serial_no: "KX-B2-0001",
    bind_status: "unbound",
    online_status: "offline",
    binding_code: "EFGH5678",
    last_seen_at: "2026-04-30T18:20:00Z"
  }
];
```

Create `backend/src/shared/db/schema.js`:

```js
function applySchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      wechat_open_id TEXT UNIQUE,
      nickname TEXT NOT NULL,
      avatar_url TEXT DEFAULT '',
      mobile TEXT DEFAULT '',
      profile_status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      serial_no TEXT NOT NULL,
      owner_user_id TEXT DEFAULT '',
      bind_status TEXT NOT NULL,
      online_status TEXT NOT NULL,
      binding_code TEXT NOT NULL UNIQUE,
      last_seen_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      status TEXT NOT NULL,
      selected_device_id TEXT DEFAULT '',
      content_json TEXT NOT NULL,
      layout_json TEXT NOT NULL,
      process_params_json TEXT NOT NULL,
      latest_preview_id TEXT DEFAULT '',
      latest_generation_id TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS previews (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      status TEXT NOT NULL,
      preview_image_url TEXT DEFAULT '',
      preview_svg_url TEXT DEFAULT '',
      metrics_json TEXT NOT NULL,
      warnings_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      preview_id TEXT NOT NULL,
      status TEXT NOT NULL,
      summary_json TEXT NOT NULL,
      gcode_asset_path TEXT DEFAULT '',
      path_asset_path TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      generation_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      status TEXT NOT NULL,
      progress_json TEXT NOT NULL,
      failure_json TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS job_events (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      status TEXT NOT NULL,
      at TEXT NOT NULL
    );
  `);
}

module.exports = {
  applySchema
};
```

Create `backend/src/shared/db/index.js`:

```js
const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { applySchema } = require("./schema");
const seedDevices = require("../../seeds/devices");

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function createDatabase(databaseFile) {
  ensureParentDir(databaseFile);
  const db = new Database(databaseFile);
  applySchema(db);

  const insertDevice = db.prepare(`
    INSERT OR IGNORE INTO devices (
      id, name, model, serial_no, owner_user_id, bind_status, online_status, binding_code, last_seen_at
    ) VALUES (
      @id, @name, @model, @serial_no, '', @bind_status, @online_status, @binding_code, @last_seen_at
    )
  `);

  seedDevices.forEach((device) => insertDevice.run(device));
  return db;
}

module.exports = {
  createDatabase
};
```

Create `backend/src/shared/storage/artifact-store.js`:

```js
const fs = require("fs");
const path = require("path");

function createArtifactStore(storageDir) {
  fs.mkdirSync(storageDir, { recursive: true });

  function writeText(relativePath, content) {
    const fullPath = path.join(storageDir, relativePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, "utf8");
    return fullPath;
  }

  return {
    writeText
  };
}

module.exports = {
  createArtifactStore
};
```

Update `backend/src/app.js`:

```js
const Fastify = require("fastify");
const envDefaults = require("./config/env");
const { createDatabase } = require("./shared/db");
const { createArtifactStore } = require("./shared/storage/artifact-store");

function buildApp(options = {}) {
  const env = Object.assign({}, envDefaults, options.env || {});
  const app = Fastify({ logger: false });

  app.decorate("env", env);
  app.decorate("db", createDatabase(env.databaseFile));
  app.decorate("artifacts", createArtifactStore(env.storageDir));

  app.get("/health", async () => ({ ok: true }));

  app.addHook("onClose", async () => {
    app.db.close();
  });

  return app;
}

module.exports = {
  buildApp
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/auth.test.js`

Workdir: `backend`

Expected: PASS

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/src/shared backend/src/seeds backend/tests/helpers/test-app.js backend/tests/auth.test.js backend/src/app.js
git commit -m "feat: add backend db bootstrap"
```

## Task 3: Implement auth routes and bearer session guard

**Files:**
- Create: `backend/src/shared/http/error-response.js`
- Create: `backend/src/shared/http/auth-guard.js`
- Create: `backend/src/shared/session/token-store.js`
- Create: `backend/src/modules/auth/service.js`
- Create: `backend/src/modules/auth/routes.js`
- Modify: `backend/src/app.js`
- Modify: `backend/tests/auth.test.js`

- [ ] **Step 1: Write the failing auth tests**

Replace `backend/tests/auth.test.js` with:

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { createTestApp } = require("./helpers/test-app");

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/auth.test.js`

Workdir: `backend`

Expected: FAIL with `404` or missing auth route assertions.

- [ ] **Step 3: Write minimal auth/session implementation**

Create `backend/src/shared/http/error-response.js`:

```js
function sendError(reply, statusCode, code, message) {
  reply.code(statusCode).send({
    code,
    message
  });
}

module.exports = {
  sendError
};
```

Create `backend/src/shared/session/token-store.js`:

```js
const crypto = require("crypto");

function createToken() {
  return crypto.randomBytes(24).toString("hex");
}

module.exports = {
  createToken
};
```

Create `backend/src/shared/http/auth-guard.js`:

```js
const { sendError } = require("./error-response");

function registerAuthGuard(app) {
  app.decorate("authenticate", async function authenticate(request, reply) {
    const header = request.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";

    if (!token) {
      return sendError(reply, 401, "auth_required", "Missing bearer token");
    }

    const session = app.db
      .prepare("SELECT token, user_id FROM sessions WHERE token = ?")
      .get(token);

    if (!session) {
      return sendError(reply, 401, "invalid_session", "Session is invalid or expired");
    }

    const user = app.db
      .prepare("SELECT id, nickname, avatar_url, mobile, profile_status FROM users WHERE id = ?")
      .get(session.user_id);

    request.currentUser = {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatar_url,
      mobile: user.mobile,
      profileStatus: user.profile_status
    };
  });
}

module.exports = {
  registerAuthGuard
};
```

Create `backend/src/modules/auth/service.js`:

```js
const crypto = require("crypto");
const { createToken } = require("../../shared/session/token-store");

function now() {
  return new Date().toISOString();
}

function userView(row) {
  return {
    id: row.id,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    mobile: row.mobile,
    profileStatus: row.profile_status
  };
}

function createAuthService(app) {
  const db = app.db;

  function wechatLogin(payload) {
    const openId = `openid_${payload.code}`;
    const user = db.prepare("SELECT * FROM users WHERE wechat_open_id = ?").get(openId);

    if (!user) {
      return {
        isNewUser: true,
        tempAuthToken: createToken(),
        nextAction: "register"
      };
    }

    const token = createToken();
    db.prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)")
      .run(token, user.id, now());

    return {
      isNewUser: false,
      token,
      user: userView(user),
      nextAction: user.profile_status === "completed" ? "enter_app" : "complete_profile"
    };
  }

  function register(payload) {
    const id = `usr_${crypto.randomUUID().slice(0, 8)}`;
    const openId = payload.wechatOpenId;
    db.prepare(`
      INSERT INTO users (id, wechat_open_id, nickname, avatar_url, mobile, profile_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, openId, payload.nickname, payload.avatarUrl || "", payload.mobile, "completed", now());

    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    const token = createToken();
    db.prepare("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)")
      .run(token, id, now());

    return {
      token,
      user: userView(user),
      nextAction: "enter_app"
    };
  }

  function completeProfile(userId, payload) {
    db.prepare(`
      UPDATE users
      SET nickname = ?, mobile = ?, profile_status = 'completed'
      WHERE id = ?
    `).run(payload.nickname, payload.mobile, userId);

    return userView(db.prepare("SELECT * FROM users WHERE id = ?").get(userId));
  }

  function getMe(userId) {
    return userView(db.prepare("SELECT * FROM users WHERE id = ?").get(userId));
  }

  return {
    wechatLogin,
    register,
    completeProfile,
    getMe
  };
}

module.exports = {
  createAuthService
};
```

Create `backend/src/modules/auth/routes.js`:

```js
const { sendError } = require("../../shared/http/error-response");

function registerAuthRoutes(app) {
  const auth = app.authService;

  app.post("/api/v1/auth/wechat-login", async (request) => {
    return auth.wechatLogin(request.body);
  });

  app.post("/api/v1/auth/register", async (request, reply) => {
    if (!request.body.agreeTerms) {
      return sendError(reply, 400, "terms_required", "Terms agreement is required");
    }
    return auth.register(request.body);
  });

  app.post("/api/v1/auth/complete-profile", { preHandler: [app.authenticate] }, async (request) => ({
    user: auth.completeProfile(request.currentUser.id, request.body)
  }));

  app.get("/api/v1/auth/me", { preHandler: [app.authenticate] }, async (request) => {
    return auth.getMe(request.currentUser.id);
  });
}

module.exports = {
  registerAuthRoutes
};
```

Update `backend/src/app.js`:

```js
const Fastify = require("fastify");
const envDefaults = require("./config/env");
const { createDatabase } = require("./shared/db");
const { createArtifactStore } = require("./shared/storage/artifact-store");
const { registerAuthGuard } = require("./shared/http/auth-guard");
const { createAuthService } = require("./modules/auth/service");
const { registerAuthRoutes } = require("./modules/auth/routes");

function buildApp(options = {}) {
  const env = Object.assign({}, envDefaults, options.env || {});
  const app = Fastify({ logger: false });

  app.decorate("env", env);
  app.decorate("db", createDatabase(env.databaseFile));
  app.decorate("artifacts", createArtifactStore(env.storageDir));

  registerAuthGuard(app);
  app.decorate("authService", createAuthService(app));

  app.get("/health", async () => ({ ok: true }));
  registerAuthRoutes(app);

  app.addHook("onClose", async () => {
    app.db.close();
  });

  return app;
}

module.exports = {
  buildApp
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/auth.test.js`

Workdir: `backend`

Expected: PASS

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/src/modules/auth backend/src/shared/http backend/src/shared/session backend/src/app.js backend/tests/auth.test.js
git commit -m "feat: implement backend auth routes"
```

## Task 4: Implement devices and projects APIs

**Files:**
- Create: `backend/src/modules/devices/service.js`
- Create: `backend/src/modules/devices/routes.js`
- Create: `backend/src/modules/projects/service.js`
- Create: `backend/src/modules/projects/routes.js`
- Modify: `backend/src/app.js`
- Create: `backend/tests/projects.test.js`

- [ ] **Step 1: Write the failing devices/projects tests**

Create `backend/tests/projects.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/projects.test.js`

Workdir: `backend`

Expected: FAIL with `404` on devices/projects routes.

- [ ] **Step 3: Write minimal devices and projects implementation**

Create `backend/src/modules/devices/service.js`:

```js
function createDevicesService(app) {
  const db = app.db;

  function listDevices() {
    const items = db.prepare(`
      SELECT id, name, model, bind_status, online_status, last_seen_at
      FROM devices
      ORDER BY id ASC
    `).all();

    return {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        model: item.model,
        bindStatus: item.bind_status,
        onlineStatus: item.online_status,
        lastSeenAt: item.last_seen_at
      }))
    };
  }

  function bindDevice(userId, bindingCode) {
    const device = db.prepare("SELECT * FROM devices WHERE binding_code = ?").get(bindingCode);
    if (!device) {
      return null;
    }

    db.prepare(`
      UPDATE devices
      SET owner_user_id = ?, bind_status = 'bound', online_status = 'online'
      WHERE id = ?
    `).run(userId, device.id);

    return {
      deviceId: device.id,
      bindStatus: "bound"
    };
  }

  return {
    listDevices,
    bindDevice
  };
}

module.exports = {
  createDevicesService
};
```

Create `backend/src/modules/devices/routes.js`:

```js
const { sendError } = require("../../shared/http/error-response");

function registerDevicesRoutes(app) {
  app.get("/api/v1/devices", { preHandler: [app.authenticate] }, async () => {
    return app.devicesService.listDevices();
  });

  app.post("/api/v1/devices/bind", { preHandler: [app.authenticate] }, async (request, reply) => {
    const result = app.devicesService.bindDevice(request.currentUser.id, request.body.bindingCode);
    if (!result) {
      return sendError(reply, 404, "device_not_found", "Binding code was not found");
    }
    return result;
  });
}

module.exports = {
  registerDevicesRoutes
};
```

Create `backend/src/modules/projects/service.js`:

```js
const crypto = require("crypto");

function now() {
  return new Date().toISOString();
}

function toProjectView(row) {
  return {
    id: row.id,
    name: row.name,
    sourceType: row.source_type,
    status: row.status,
    selectedDeviceId: row.selected_device_id || "",
    content: JSON.parse(row.content_json),
    layout: JSON.parse(row.layout_json),
    processParams: JSON.parse(row.process_params_json),
    latestPreviewId: row.latest_preview_id || "",
    latestGenerationId: row.latest_generation_id || "",
    updatedAt: row.updated_at
  };
}

function createProjectsService(app) {
  const db = app.db;

  function createProject(userId, payload) {
    const id = `prj_${crypto.randomUUID().slice(0, 8)}`;
    const createdAt = now();
    db.prepare(`
      INSERT INTO projects (
        id, owner_user_id, name, source_type, status, selected_device_id,
        content_json, layout_json, process_params_json, latest_preview_id,
        latest_generation_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, ?)
    `).run(
      id,
      userId,
      payload.name,
      payload.sourceType,
      "draft",
      payload.selectedDeviceId || "",
      JSON.stringify(payload.content || { text: "", imageAssetId: null }),
      JSON.stringify(payload.layout || { widthMm: 80, heightMm: 50 }),
      JSON.stringify(payload.processParams || { speed: 1000, power: 65 }),
      createdAt,
      createdAt
    );

    return {
      id,
      status: "draft"
    };
  }

  function listProjects(userId) {
    const items = db.prepare(`
      SELECT * FROM projects
      WHERE owner_user_id = ?
      ORDER BY updated_at DESC
    `).all(userId);

    return {
      items: items.map(toProjectView),
      page: 1,
      pageSize: items.length,
      total: items.length
    };
  }

  function getProject(userId, projectId) {
    const row = db.prepare(`
      SELECT * FROM projects WHERE id = ? AND owner_user_id = ?
    `).get(projectId, userId);

    return row ? toProjectView(row) : null;
  }

  function updateProject(userId, projectId, payload) {
    const existing = getProject(userId, projectId);
    if (!existing) {
      return null;
    }

    const next = {
      name: payload.name || existing.name,
      sourceType: payload.sourceType || existing.sourceType,
      selectedDeviceId: payload.selectedDeviceId || existing.selectedDeviceId,
      content: payload.content || existing.content,
      layout: payload.layout || existing.layout,
      processParams: payload.processParams || existing.processParams
    };

    db.prepare(`
      UPDATE projects
      SET name = ?, source_type = ?, selected_device_id = ?, content_json = ?, layout_json = ?, process_params_json = ?, updated_at = ?
      WHERE id = ? AND owner_user_id = ?
    `).run(
      next.name,
      next.sourceType,
      next.selectedDeviceId,
      JSON.stringify(next.content),
      JSON.stringify(next.layout),
      JSON.stringify(next.processParams),
      now(),
      projectId,
      userId
    );

    return getProject(userId, projectId);
  }

  return {
    createProject,
    listProjects,
    getProject,
    updateProject
  };
}

module.exports = {
  createProjectsService
};
```

Create `backend/src/modules/projects/routes.js`:

```js
const { sendError } = require("../../shared/http/error-response");

function registerProjectsRoutes(app) {
  app.post("/api/v1/projects", { preHandler: [app.authenticate] }, async (request) => {
    return app.projectsService.createProject(request.currentUser.id, request.body);
  });

  app.get("/api/v1/projects", { preHandler: [app.authenticate] }, async (request) => {
    return app.projectsService.listProjects(request.currentUser.id);
  });

  app.get("/api/v1/projects/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const project = app.projectsService.getProject(request.currentUser.id, request.params.id);
    if (!project) {
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    return project;
  });

  app.put("/api/v1/projects/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const project = app.projectsService.updateProject(request.currentUser.id, request.params.id, request.body);
    if (!project) {
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    return project;
  });
}

module.exports = {
  registerProjectsRoutes
};
```

Update `backend/src/app.js` by adding:

```js
const { createDevicesService } = require("./modules/devices/service");
const { registerDevicesRoutes } = require("./modules/devices/routes");
const { createProjectsService } = require("./modules/projects/service");
const { registerProjectsRoutes } = require("./modules/projects/routes");
```

and inside `buildApp` after auth service:

```js
app.decorate("devicesService", createDevicesService(app));
app.decorate("projectsService", createProjectsService(app));
registerDevicesRoutes(app);
registerProjectsRoutes(app);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/projects.test.js`

Workdir: `backend`

Expected: PASS

- [ ] **Step 5: Commit**

Run:

```bash
git add backend/src/modules/devices backend/src/modules/projects backend/src/app.js backend/tests/projects.test.js
git commit -m "feat: implement devices and projects apis"
```

## Task 5: Implement previews, generations, workers, and jobs

**Files:**
- Create: `backend/src/workers/runtime.js`
- Create: `backend/src/workers/tasks.js`
- Create: `backend/src/modules/previews/service.js`
- Create: `backend/src/modules/previews/routes.js`
- Create: `backend/src/modules/generations/service.js`
- Create: `backend/src/modules/generations/routes.js`
- Create: `backend/src/modules/jobs/service.js`
- Create: `backend/src/modules/jobs/routes.js`
- Modify: `backend/src/app.js`
- Create: `backend/tests/workflows.test.js`

- [ ] **Step 1: Write the failing workflow test**

Create `backend/tests/workflows.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/workflows.test.js`

Workdir: `backend`

Expected: FAIL with missing preview/generation/job routes.

- [ ] **Step 3: Write minimal worker runtime**

Create `backend/src/workers/runtime.js`:

```js
function createWorkerRuntime() {
  function enqueue(task) {
    setTimeout(async () => {
      try {
        await task();
      } catch (error) {
        console.error(error);
      }
    }, 20);
  }

  return {
    enqueue
  };
}

module.exports = {
  createWorkerRuntime
};
```

Create `backend/src/workers/tasks.js`:

```js
function now() {
  return new Date().toISOString();
}

function createWorkerTasks(app) {
  const db = app.db;
  const artifacts = app.artifacts;

  function completePreview(previewId) {
    artifacts.writeText(`previews/${previewId}.txt`, `Preview ready for ${previewId}`);
    artifacts.writeText(`previews/${previewId}.svg`, `<svg xmlns="http://www.w3.org/2000/svg"></svg>`);

    db.prepare(`
      UPDATE previews
      SET status = ?, preview_image_url = ?, preview_svg_url = ?, metrics_json = ?, warnings_json = ?
      WHERE id = ?
    `).run(
      "ready",
      `/storage/previews/${previewId}.txt`,
      `/storage/previews/${previewId}.svg`,
      JSON.stringify({ widthMm: 80, heightMm: 50, pathCount: 126, estimatedDurationSec: 420 }),
      JSON.stringify([]),
      previewId
    );
  }

  function completeGeneration(generationId) {
    artifacts.writeText(`generations/${generationId}.gcode`, "G0 X0 Y0\nG1 X10 Y10");
    artifacts.writeText(`generations/${generationId}.path.txt`, "mock path data");

    db.prepare(`
      UPDATE generations
      SET status = ?, summary_json = ?, gcode_asset_path = ?, path_asset_path = ?
      WHERE id = ?
    `).run(
      "ready",
      JSON.stringify({ lineCount: 2, estimatedDurationSec: 420, boundsMm: { width: 80, height: 50 } }),
      `/storage/generations/${generationId}.gcode`,
      `/storage/generations/${generationId}.path.txt`,
      generationId
    );
  }

  function pushJobEvent(jobId, status) {
    db.prepare("INSERT INTO job_events (id, job_id, status, at) VALUES (?, ?, ?, ?)")
      .run(`${jobId}_${status}_${Date.now()}`, jobId, status, now());
  }

  function updateJob(jobId, status, percent, step) {
    db.prepare(`
      UPDATE jobs
      SET status = ?, progress_json = ?, updated_at = ?
      WHERE id = ?
    `).run(status, JSON.stringify({ percent, currentStep: step }), now(), jobId);
    pushJobEvent(jobId, status);
  }

  async function runJob(jobId) {
    updateJob(jobId, "dispatching", 10, "dispatching");
    await new Promise((resolve) => setTimeout(resolve, 40));
    updateJob(jobId, "running", 65, "streaming");
    await new Promise((resolve) => setTimeout(resolve, 60));
    updateJob(jobId, "completed", 100, "running");
  }

  return {
    completePreview,
    completeGeneration,
    runJob
  };
}

module.exports = {
  createWorkerTasks
};
```

- [ ] **Step 4: Write preview, generation, and job modules**

Create `backend/src/modules/previews/service.js`:

```js
const crypto = require("crypto");

function now() {
  return new Date().toISOString();
}

function createPreviewsService(app) {
  const db = app.db;

  function createPreview(userId, projectId) {
    const project = db.prepare("SELECT * FROM projects WHERE id = ? AND owner_user_id = ?").get(projectId, userId);
    if (!project) {
      return null;
    }

    const previewId = `pre_${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO previews (id, project_id, status, preview_image_url, preview_svg_url, metrics_json, warnings_json, created_at)
      VALUES (?, ?, 'processing', '', '', '{}', '[]', ?)
    `).run(previewId, projectId, now());

    db.prepare("UPDATE projects SET latest_preview_id = ?, updated_at = ? WHERE id = ?")
      .run(previewId, now(), projectId);

    app.workerRuntime.enqueue(async () => {
      app.workerTasks.completePreview(previewId);
    });

    return {
      previewId,
      status: "processing"
    };
  }

  function getPreview(previewId) {
    const row = db.prepare("SELECT * FROM previews WHERE id = ?").get(previewId);
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      status: row.status,
      previewImageUrl: row.preview_image_url,
      previewSvgUrl: row.preview_svg_url,
      metrics: JSON.parse(row.metrics_json),
      warnings: JSON.parse(row.warnings_json)
    };
  }

  return {
    createPreview,
    getPreview
  };
}

module.exports = {
  createPreviewsService
};
```

Create `backend/src/modules/previews/routes.js`:

```js
const { sendError } = require("../../shared/http/error-response");

function registerPreviewRoutes(app) {
  app.post("/api/v1/projects/:id/preview", { preHandler: [app.authenticate] }, async (request, reply) => {
    const preview = app.previewsService.createPreview(request.currentUser.id, request.params.id);
    if (!preview) {
      return sendError(reply, 404, "project_not_found", "Project was not found");
    }
    return preview;
  });

  app.get("/api/v1/previews/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const preview = app.previewsService.getPreview(request.params.id);
    if (!preview) {
      return sendError(reply, 404, "preview_not_found", "Preview was not found");
    }
    return preview;
  });
}

module.exports = {
  registerPreviewRoutes
};
```

Create `backend/src/modules/generations/service.js`:

```js
const crypto = require("crypto");

function now() {
  return new Date().toISOString();
}

function createGenerationsService(app) {
  const db = app.db;

  function createGeneration(userId, projectId, previewId) {
    const project = db.prepare("SELECT * FROM projects WHERE id = ? AND owner_user_id = ?").get(projectId, userId);
    const preview = db.prepare("SELECT * FROM previews WHERE id = ? AND project_id = ?").get(previewId, projectId);
    if (!project || !preview) {
      return null;
    }

    const generationId = `gen_${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO generations (id, project_id, preview_id, status, summary_json, gcode_asset_path, path_asset_path, created_at)
      VALUES (?, ?, ?, 'processing', '{}', '', '', ?)
    `).run(generationId, projectId, previewId, now());

    db.prepare("UPDATE projects SET latest_generation_id = ?, updated_at = ? WHERE id = ?")
      .run(generationId, now(), projectId);

    app.workerRuntime.enqueue(async () => {
      app.workerTasks.completeGeneration(generationId);
    });

    return {
      generationId,
      status: "processing"
    };
  }

  function getGeneration(generationId) {
    const row = db.prepare("SELECT * FROM generations WHERE id = ?").get(generationId);
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      status: row.status,
      summary: JSON.parse(row.summary_json)
    };
  }

  return {
    createGeneration,
    getGeneration
  };
}

module.exports = {
  createGenerationsService
};
```

Create `backend/src/modules/generations/routes.js`:

```js
const { sendError } = require("../../shared/http/error-response");

function registerGenerationRoutes(app) {
  app.post("/api/v1/projects/:id/generate", { preHandler: [app.authenticate] }, async (request, reply) => {
    const generation = app.generationsService.createGeneration(
      request.currentUser.id,
      request.params.id,
      request.body.previewId
    );

    if (!generation) {
      return sendError(reply, 404, "generation_input_not_found", "Project or preview was not found");
    }

    return generation;
  });

  app.get("/api/v1/generations/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const generation = app.generationsService.getGeneration(request.params.id);
    if (!generation) {
      return sendError(reply, 404, "generation_not_found", "Generation was not found");
    }
    return generation;
  });
}

module.exports = {
  registerGenerationRoutes
};
```

Create `backend/src/modules/jobs/service.js`:

```js
const crypto = require("crypto");

function now() {
  return new Date().toISOString();
}

function parseFailure(value) {
  return value ? JSON.parse(value) : null;
}

function createJobsService(app) {
  const db = app.db;

  function createJob(userId, payload) {
    const project = db.prepare("SELECT * FROM projects WHERE id = ? AND owner_user_id = ?").get(payload.projectId, userId);
    const generation = db.prepare("SELECT * FROM generations WHERE id = ? AND project_id = ?").get(payload.generationId, payload.projectId);
    const device = db.prepare("SELECT * FROM devices WHERE id = ?").get(payload.deviceId);

    if (!project || !generation || !device) {
      return null;
    }

    const jobId = `job_${crypto.randomUUID().slice(0, 8)}`;
    const createdAt = now();
    db.prepare(`
      INSERT INTO jobs (id, project_id, generation_id, device_id, status, progress_json, failure_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'queued', ?, '', ?, ?)
    `).run(jobId, payload.projectId, payload.generationId, payload.deviceId, JSON.stringify({ percent: 0, currentStep: "queued" }), createdAt, createdAt);

    db.prepare("INSERT INTO job_events (id, job_id, status, at) VALUES (?, ?, ?, ?)")
      .run(`${jobId}_queued`, jobId, "queued", createdAt);

    app.workerRuntime.enqueue(async () => {
      await app.workerTasks.runJob(jobId);
    });

    return {
      jobId,
      status: "queued"
    };
  }

  function listJobs() {
    const rows = db.prepare("SELECT * FROM jobs ORDER BY updated_at DESC").all();
    return {
      items: rows.map((row) => ({
        id: row.id,
        projectId: row.project_id,
        deviceId: row.device_id,
        status: row.status,
        progress: JSON.parse(row.progress_json),
        updatedAt: row.updated_at
      })),
      page: 1,
      pageSize: rows.length,
      total: rows.length
    };
  }

  function getJob(jobId) {
    const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId);
    if (!row) {
      return null;
    }

    const events = db.prepare("SELECT status, at FROM job_events WHERE job_id = ? ORDER BY at ASC").all(jobId);
    return {
      id: row.id,
      projectId: row.project_id,
      generationId: row.generation_id,
      deviceId: row.device_id,
      status: row.status,
      progress: JSON.parse(row.progress_json),
      failure: parseFailure(row.failure_json),
      timeline: events
    };
  }

  function cancelJob(jobId) {
    const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId);
    if (!row) {
      return null;
    }

    db.prepare("UPDATE jobs SET status = ?, progress_json = ?, updated_at = ? WHERE id = ?")
      .run("canceled", JSON.stringify({ percent: 0, currentStep: "canceled" }), now(), jobId);
    db.prepare("INSERT INTO job_events (id, job_id, status, at) VALUES (?, ?, ?, ?)")
      .run(`${jobId}_canceled_${Date.now()}`, jobId, "canceled", now());

    return getJob(jobId);
  }

  function retryJob(jobId) {
    const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId);
    if (!row) {
      return null;
    }

    return createJob("system", {
      projectId: row.project_id,
      generationId: row.generation_id,
      deviceId: row.device_id
    });
  }

  return {
    createJob,
    listJobs,
    getJob,
    cancelJob,
    retryJob
  };
}

module.exports = {
  createJobsService
};
```

Create `backend/src/modules/jobs/routes.js`:

```js
const { sendError } = require("../../shared/http/error-response");

function registerJobRoutes(app) {
  app.post("/api/v1/jobs", { preHandler: [app.authenticate] }, async (request, reply) => {
    const job = app.jobsService.createJob(request.currentUser.id, request.body);
    if (!job) {
      return sendError(reply, 404, "job_input_not_found", "Project, generation, or device was not found");
    }
    return job;
  });

  app.get("/api/v1/jobs", { preHandler: [app.authenticate] }, async () => {
    return app.jobsService.listJobs();
  });

  app.get("/api/v1/jobs/:id", { preHandler: [app.authenticate] }, async (request, reply) => {
    const job = app.jobsService.getJob(request.params.id);
    if (!job) {
      return sendError(reply, 404, "job_not_found", "Job was not found");
    }
    return job;
  });

  app.post("/api/v1/jobs/:id/cancel", { preHandler: [app.authenticate] }, async (request, reply) => {
    const job = app.jobsService.cancelJob(request.params.id);
    if (!job) {
      return sendError(reply, 404, "job_not_found", "Job was not found");
    }
    return job;
  });

  app.post("/api/v1/jobs/:id/retry", { preHandler: [app.authenticate] }, async (request, reply) => {
    const job = app.jobsService.retryJob(request.params.id);
    if (!job) {
      return sendError(reply, 404, "job_not_found", "Job was not found");
    }
    return job;
  });
}

module.exports = {
  registerJobRoutes
};
```

Update `backend/src/app.js` by adding:

```js
const { createWorkerRuntime } = require("./workers/runtime");
const { createWorkerTasks } = require("./workers/tasks");
const { createPreviewsService } = require("./modules/previews/service");
const { registerPreviewRoutes } = require("./modules/previews/routes");
const { createGenerationsService } = require("./modules/generations/service");
const { registerGenerationRoutes } = require("./modules/generations/routes");
const { createJobsService } = require("./modules/jobs/service");
const { registerJobRoutes } = require("./modules/jobs/routes");
```

and inside `buildApp` after artifact store:

```js
app.decorate("workerRuntime", createWorkerRuntime());
app.decorate("workerTasks", null);
```

after project service:

```js
app.decorate("previewsService", createPreviewsService(app));
app.decorate("generationsService", createGenerationsService(app));
app.decorate("jobsService", createJobsService(app));
app.decorate("workerTasks", createWorkerTasks(app));
registerPreviewRoutes(app);
registerGenerationRoutes(app);
registerJobRoutes(app);
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test tests/workflows.test.js`

Workdir: `backend`

Expected: PASS

- [ ] **Step 6: Run the full backend test suite**

Run: `npm test`

Workdir: `backend`

Expected: PASS with `auth.test.js`, `projects.test.js`, and `workflows.test.js`.

- [ ] **Step 7: Commit**

Run:

```bash
git add backend/src/modules/previews backend/src/modules/generations backend/src/modules/jobs backend/src/workers backend/src/app.js backend/tests/workflows.test.js
git commit -m "feat: implement backend async workflows"
```

## Task 6: Point the mini program to the backend and verify the P0 loop

**Files:**
- Modify: `miniprogram/config/env.js`
- Modify if needed: `miniprogram/services/api/real-adapter.js`
- Test: `backend/src/server.js`
- Test: existing frontend node tests

- [ ] **Step 1: Write the failing environment expectation**

Open `miniprogram/config/env.js` and confirm it still points to mock mode:

```js
module.exports = {
  useMock: true,
  apiBaseUrl: "https://example.invalid/api/v1"
};
```

This is the failing starting point because it will never hit the new backend.

- [ ] **Step 2: Switch mini program env to real backend**

Replace `miniprogram/config/env.js` with:

```js
module.exports = {
  useMock: false,
  apiBaseUrl: "http://127.0.0.1:3100/api/v1"
};
```

- [ ] **Step 3: Run backend locally**

Run: `npm install && node src/server.js`

Workdir: `backend`

Expected: server boots on `http://127.0.0.1:3100`

- [ ] **Step 4: Run frontend adapter tests**

Run:

```bash
node tests/request.test.js
node tests/real-adapter.test.js
node tests/session.test.js
node tests/auth-page-guard.test.js
node tests/mock-project-list.test.js
node tests/project-formatters.test.js
node tests/status-formatters.test.js
```

Workdir: repository root

Expected: PASS

- [ ] **Step 5: Verify one manual end-to-end API loop**

Run these commands in PowerShell after backend is running:

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3100/api/v1/auth/register -ContentType "application/json" -Body '{"wechatOpenId":"openid_manual","nickname":"Manual User","avatarUrl":"","mobile":"13800000000","agreeTerms":true}'
$headers = @{ Authorization = "Bearer $($login.token)" }
$project = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3100/api/v1/projects -Headers $headers -ContentType "application/json" -Body '{"name":"Manual Project","sourceType":"text","selectedDeviceId":"dev_123","content":{"text":"Best Mom","imageAssetId":null},"layout":{"widthMm":80,"heightMm":50,"rotationDeg":0,"align":"center"},"processParams":{"speed":1000,"power":65,"passes":1,"lineSpacing":1.2}}'
$preview = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:3100/api/v1/projects/$($project.id)/preview" -Headers $headers -ContentType "application/json" -Body '{"forceRegenerate":true}'
Start-Sleep -Milliseconds 120
$previewDetail = Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:3100/api/v1/previews/$($preview.previewId)" -Headers $headers
$generation = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:3100/api/v1/projects/$($project.id)/generate" -Headers $headers -ContentType "application/json" -Body "{""previewId"":""$($preview.previewId)""}"
Start-Sleep -Milliseconds 120
$job = Invoke-RestMethod -Method Post -Uri http://127.0.0.1:3100/api/v1/jobs -Headers $headers -ContentType "application/json" -Body "{""projectId"":""$($project.id)"",""generationId"":""$($generation.generationId)"",""deviceId"":""dev_123"",""executionMode"":""offline_file""}"
Start-Sleep -Milliseconds 220
$jobDetail = Invoke-RestMethod -Method Get -Uri "http://127.0.0.1:3100/api/v1/jobs/$($job.jobId)" -Headers $headers
$previewDetail.status
$jobDetail.status
```

Expected:

- preview status prints `ready`
- job status prints `completed`

- [ ] **Step 6: Commit**

Run:

```bash
git add miniprogram/config/env.js
git commit -m "chore: point miniprogram to local backend"
```

## Self-Review

### Spec coverage

- Runtime shape and file layout: covered by Tasks 1 and 2
- Auth/session: covered by Task 3
- Devices and projects: covered by Task 4
- Preview/generation/job async resources: covered by Task 5
- Frontend real-mode hookup and manual loop verification: covered by Task 6

No spec sections are currently left without a matching task.

### Placeholder scan

- No `TODO`, `TBD`, or “similar to above” placeholders remain.
- Every code-changing step includes file content or exact snippets.
- Every verification step includes a command and expected result.

### Type consistency

- API paths match the spec and current frontend adapter.
- Entity names are consistent across schema, services, and routes.
- Response property names match the mini program expectations: `token`, `user`, `previewId`, `generationId`, `jobId`, `items`.
