const assert = require("assert");
const path = require("path");

const formatterPath = path.resolve(__dirname, "../miniprogram/utils/status-formatters.js");

delete require.cache[formatterPath];

let failed = false;

try {
  const {
    formatJobStatus,
    formatDeviceStatus,
    formatPreviewStatus,
    formatJobStep
  } = require(formatterPath);

  assert.strictEqual(formatJobStatus("running"), "运行中");
  assert.strictEqual(formatJobStatus("failed"), "失败");
  assert.strictEqual(formatDeviceStatus("offline"), "离线");
  assert.strictEqual(formatPreviewStatus("processing"), "生成中");
  assert.strictEqual(formatJobStep("streaming"), "发送中");
  assert.strictEqual(formatJobStep("queued"), "排队中");
  assert.strictEqual(formatJobStep("canceled"), "已取消");
} catch (error) {
  failed = true;
  console.error(error);
}

if (failed) {
  process.exit(1);
}
