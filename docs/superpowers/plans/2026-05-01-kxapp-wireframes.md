# KXApp Mini Program Low-Fidelity Wireframes

**Purpose:** Provide page-by-page low-fidelity layout guidance for the first-pass WeChat mini program.

**Scope:** P0 first, with restrained P1 hints only where useful.

---

## 1. Layout Principles

1. Keep pages operational, not promotional.
2. Prioritize the fastest path to create, preview, and submit a job.
3. Make device state and task state visible early.
4. Avoid dense visual editing controls in P0.
5. Use full-width sections, not nested card stacks.

## 2. Global Mobile Layout Rules

- top area: page title + optional secondary action
- content area: vertically stacked sections
- bottom safe area:
  - tab bar on main pages
  - fixed primary CTA on task-critical pages
- use one primary action per screen

## 3. Login Entry Wireframe

**Route**

`/pages/auth/login/index`

**Wireframe**

```text
+----------------------------------+
|                                  |
|          [ App Name ]            |
|   Short one-line intro text      |
|                                  |
|        [ 微信快捷登录 ]           |
|                                  |
|  登录即表示同意 用户协议 隐私政策   |
|                                  |
+----------------------------------+
```

**Behavior notes**

- page should feel clean and short
- do not add secondary login methods in P0

## 4. Registration Completion Wireframe

**Route**

`/pages/auth/register/index`

**Wireframe**

```text
+----------------------------------+
| 完成注册                         |
| 补充基础信息后即可开始使用         |
|                                  |
| 昵称                             |
| [____________________________]   |
|                                  |
| 手机号                           |
| [____________________________]   |
|                                  |
| [ ] 我已阅读并同意相关协议         |
|                                  |
|        [ 完成并进入 ]             |
+----------------------------------+
```

**Behavior notes**

- primary button fixed near bottom if content grows
- show validation errors inline below each field

## 5. Complete Profile Wireframe

**Route**

`/pages/auth/complete-profile/index`

**Wireframe**

Same structure as registration completion, but only render missing fields.

## 6. Workspace Wireframe

**Route**

`/pages/workspace/index`

**Wireframe**

```text
+----------------------------------+
| 工作台                    [设备]  |
|                                  |
| 当前设备                         |
| KX Laser A1   在线                |
| [ 选择设备 ]                      |
|                                  |
| 快速开始                         |
| [ 新建文字项目 ]                  |
| [ 新建图片项目 ]                  |
|                                  |
| 最近项目                         |
| -------------------------------- |
| 母亲节牌匾      10:05            |
| 文字项目        草稿              |
| -------------------------------- |
| 花纹雕刻         昨天             |
| 图片项目        已预览            |
+----------------------------------+
| 工作台 | 任务 | 设备 | 我的       |
+----------------------------------+
```

**Behavior notes**

- “当前设备” section should stay near top
- “快速开始” must be above recent project list

## 7. Project Editor Wireframe

**Route**

`/pages/workspace/editor/index`

**Wireframe**

```text
+----------------------------------+
| 编辑项目                  [保存]  |
|                                  |
| 项目名称                         |
| [____________________________]   |
|                                  |
| 设备 / 机型                       |
| [ KX Laser A1              > ]   |
|                                  |
| 内容类型                         |
| [ 文字 ]   [ 图片 ]              |
|                                  |
| 文字内容 / 图片上传区             |
| [____________________________]   |
| 或                               |
| [ 上传图片 ]                      |
|                                  |
| 尺寸参数                         |
| 宽度 [____]  高度 [____]         |
| 旋转 [____]                      |
|                                  |
| 加工参数                         |
| 速度 [____]  功率 [____]         |
| 次数 [____]                      |
|                                  |
|        [ 生成预览 ]              |
+----------------------------------+
```

**Behavior notes**

- keep text/image mode switch obvious
- hide irrelevant controls by mode
- no advanced tabs in P0

## 8. Preview Wireframe

**Route**

`/pages/preview/index`

**Wireframe**

```text
+----------------------------------+
| 预览结果                         |
|                                  |
| [                                |
|         preview image            |
|                                ] |
|                                  |
| 预览状态: 已完成 / 处理中         |
| 预计时长: 7分00秒                 |
| 路径数量: 126                     |
|                                  |
| 风险提示                         |
| - 超出边界警告 / 无警告           |
|                                  |
| [ 返回编辑 ]   [ 重新生成 ]       |
|                                  |
|        [ 提交任务 ]              |
+----------------------------------+
```

**Behavior notes**

- primary CTA is always `提交任务`
- when processing, disable submit and show loading state

## 9. Task List Wireframe

**Route**

`/pages/tasks/index`

**Wireframe**

```text
+----------------------------------+
| 任务                             |
| [全部][排队][运行中][失败][完成]  |
|                                  |
| -------------------------------- |
| 母亲节牌匾                       |
| KX Laser A1                      |
| 运行中  64%        10:09         |
| -------------------------------- |
| 花纹雕刻                         |
| KX Laser A1                      |
| 失败    可重试      09:20        |
|                     [重试]       |
| -------------------------------- |
+----------------------------------+
| 工作台 | 任务 | 设备 | 我的       |
+----------------------------------+
```

**Behavior notes**

- tabs should be horizontally scrollable only if truly necessary
- job cards should be quick to scan

## 10. Task Detail Wireframe

**Route**

`/pages/tasks/detail/index`

**Wireframe**

```text
+----------------------------------+
| 任务详情                         |
|                                  |
| 项目名称: 母亲节牌匾              |
| 设备名称: KX Laser A1             |
| 当前状态: 运行中                  |
|                                  |
| [===========------] 64%          |
| 当前步骤: streaming               |
|                                  |
| 更新时间: 10:09                  |
|                                  |
| 状态时间线                       |
| - 10:07 已排队                    |
| - 10:08 开始执行                  |
|                                  |
| 失败原因区（失败时显示）           |
| [ message ]                      |
|                                  |
| [ 刷新状态 ] [ 查看原项目 ]       |
|                                  |
|      [ 取消任务 / 重试任务 ]      |
+----------------------------------+
```

**Behavior notes**

- bottom action changes by status
- never show both cancel and retry at the same time unless truly valid

## 11. Device List Wireframe

**Route**

`/pages/devices/index`

**Wireframe**

```text
+----------------------------------+
| 设备                             |
|                                  |
| -------------------------------- |
| KX Laser A1                      |
| esp32_grbl                       |
| 在线     最近心跳 10:08          |
| -------------------------------- |
| KX Laser B2                      |
| esp32_grbl                       |
| 离线     最近心跳 昨天           |
| -------------------------------- |
|                                  |
|        [ 绑定新设备 ]            |
+----------------------------------+
| 工作台 | 任务 | 设备 | 我的       |
+----------------------------------+
```

**Behavior notes**

- selecting a device should be one tap
- bound devices should appear before any discover/bind affordance

## 12. Device Bind Wireframe

**Route**

`/pages/devices/bind/index`

**Wireframe**

```text
+----------------------------------+
| 绑定设备                         |
| 输入设备绑定码                    |
|                                  |
| 绑定码                           |
| [____________________________]   |
|                                  |
|        [ 确认绑定 ]              |
+----------------------------------+
```

**Behavior notes**

- keep this page extremely short

## 13. My Page Wireframe

**Route**

`/pages/profile/index`

**Wireframe**

```text
+----------------------------------+
| 我的                             |
|                                  |
| [头像]  Alice                    |
| 手机号 13800000000               |
|                                  |
| -------------------------------- |
| 我的项目                      >  |
| 编辑资料                      >  |
| 帮助中心                      >  |
| 用户协议                      >  |
| 隐私政策                      >  |
| -------------------------------- |
|                                  |
|         [ 退出登录 ]             |
+----------------------------------+
| 工作台 | 任务 | 设备 | 我的       |
+----------------------------------+
```

## 14. P1 Extension Wireframes

### Template List

Place as an entry from Workspace, not a top-level tab.

### Project History

Can share layout patterns with Task List:

- status
- updated time
- quick duplicate action

## 15. Interaction Priority

Order of design importance:

1. Login / registration completion
2. Workspace quick start
3. Project editor
4. Preview submit loop
5. Task visibility
6. Device selection and binding

## 16. Final P0 Visual Guidance

- quiet, operational UI
- medium information density
- strong fixed CTA on action-heavy pages
- no decorative hero blocks
- no overbuilt card stacks
- no attempt to mimic desktop editor complexity
