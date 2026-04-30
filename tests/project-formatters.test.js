const assert = require("assert");
const path = require("path");

const formatterPath = path.resolve(__dirname, "../miniprogram/utils/project-formatters.js");

delete require.cache[formatterPath];
const {
  formatProjectType,
  formatProjectUpdatedAt,
  formatArtifactState
} = require(formatterPath);

assert.strictEqual(formatProjectType("text"), "文字");
assert.strictEqual(formatProjectType("image"), "图片");
assert.strictEqual(formatArtifactState(null), "未生成");
assert.strictEqual(formatArtifactState("pre_123"), "已生成");
assert.strictEqual(
  formatProjectUpdatedAt("2026-05-01T10:05:00Z"),
  "2026-05-01 10:05:00"
);
