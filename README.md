# wechatapp

KXApp 微信小程序迁移项目（`wechatapp`）：

- 小程序端：`miniprogram/`
- 后端服务：`backend/`（Fastify + SQLite）
- 契约与规划文档：`docs/superpowers/`

## 本地开发

### 1) 后端启动

```powershell
cd backend
npm install
npm run dev
```

默认地址：

- `http://127.0.0.1:3100`
- API base：`http://127.0.0.1:3100/api/v1`

### 2) 小程序环境

当前小程序环境配置在 `miniprogram/config/env.js`，已指向本地后端：

- `useMock: false`
- `apiBaseUrl: "http://127.0.0.1:3100/api/v1"`

## 测试命令

### 前端与契约测试（仓库根目录）

```powershell
node tests/request.test.js
node tests/real-adapter.test.js
node tests/session.test.js
node tests/auth-page-guard.test.js
node tests/mock-project-list.test.js
node tests/project-formatters.test.js
node tests/status-formatters.test.js
node tests/task-detail-page.test.js
node tests/failure-code-contract.test.js
node tests/failure-contract-doc.test.js
node tests/failure-code-doc-sync.test.js
```

### 后端测试

```powershell
cd backend
npm test
```

Windows 本地建议优先使用稳定命令（自动处理 native 模块 ABI）：

```powershell
cd backend
npm run test:stable
```

## CI 说明

已配置 GitHub Actions：`.github/workflows/ci.yml`

- `frontend-tests`：运行根目录所有前端/契约测试
- `backend-tests`：在 `backend/` 执行 `npm ci` + `npm test`

触发时机：

- `push`
- `pull_request`

## 当前阶段说明

目前处于 P0 闭环阶段，核心链路已可运行：

- 注册/登录
- 项目创建
- 预览与生成
- 任务创建、查询、取消、重试
- 失败码契约与前后端一致性校验
