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

## 基于 `kxapp` 的改进落地

参考 `D:\GIT\kxapp` 的逆向分析结论（轻前端 + 云端任务 + 设备侧适配），本项目持续按以下方向收敛：

- 小程序侧聚焦轻量编辑、任务入口、状态可视化
- 后端侧承接预览生成、生成物输出、任务调度
- 设备直连与复杂实时控制保持后置，不做 Android 1:1 复刻

本次新增：

- `我的` 页「帮助中心」入口已接入真实页面：`miniprogram/pages/help/index`
- 帮助中心页面提供推荐操作顺序与当前能力边界，降低新同学上手成本
- `登录` 页与 `我的` 页均已接入：
  - `用户协议`：`miniprogram/pages/legal/user-agreement/index`
  - `隐私政策`：`miniprogram/pages/legal/privacy-policy/index`
- 帮助中心已升级为“适用范围 + 操作顺序 + 能力边界 + 常见问题 + 联系方式占位”
- 协议与隐私页已补充版本信息区块（版本号、生效日期、最近更新）
- 帮助中心 FAQ 已改为配置化数据源：`miniprogram/config/help-center.js`

法务替换说明：

- 当前协议与隐私页面为“示例版结构化文案”，便于先打通入口与阅读流程
- 后续可仅替换页面正文内容，不需修改页面路由和入口绑定
