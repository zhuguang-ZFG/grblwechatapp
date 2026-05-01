const pageAuth = require("../../utils/page-auth");

Page({
  data: {
    scope: [
      "适用于当前 KXApp 微信小程序（P0/P1 阶段）",
      "覆盖登录、项目、预览、任务、设备与账户相关说明"
    ],
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
    ],
    faqList: [
      {
        question: "为什么预览不是立刻完成？",
        answer: "预览由后端异步生成，页面会显示处理中状态，刷新后可查看 ready 结果。"
      },
      {
        question: "任务失败后如何处理？",
        answer: "先查看失败码与建议，再按页面提示重试，必要时切换设备或调整参数。"
      },
      {
        question: "小程序可以直接控制设备吗？",
        answer: "当前以后端调度为主，小程序负责提交任务和查看状态，不做原生直连控制。"
      },
      {
        question: "协议和隐私政策在哪里查看？",
        answer: "登录页与我的页都提供入口，可随时打开阅读。"
      }
    ],
    contact: [
      "反馈入口：我的 -> 帮助中心",
      "支持邮箱（占位）：support@example.com"
    ]
  },

  onShow() {
    pageAuth.requireAuth();
  }
});
