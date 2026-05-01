const pageAuth = require("../../utils/page-auth");

Page({
  data: {
    quickFlows: [
      "登录后先到设备页选择或绑定设备",
      "在工作台新建文字或图片项目",
      "编辑完成后进入预览页并提交任务",
      "在任务页跟踪进度并处理失败重试"
    ],
    capabilityBoundary: [
      "小程序负责轻编辑、任务入口、状态展示",
      "后端负责预览生成、GCode 生成和任务调度",
      "设备直连与复杂实时控制暂由网关/后端模拟"
    ]
  },

  onShow() {
    pageAuth.requireAuth();
  }
});
