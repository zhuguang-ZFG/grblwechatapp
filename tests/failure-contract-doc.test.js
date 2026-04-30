const assert = require("assert");
const path = require("path");
const fs = require("fs");

const docPath = path.resolve(
  __dirname,
  "../docs/superpowers/specs/2026-05-01-kxapp-failure-codes-v0.md"
);

function run() {
  const content = fs.readFileSync(docPath, "utf8");

  assert.ok(content.includes("invalid_retry_target"), "doc should include invalid_retry_target");
  assert.ok(content.includes("invalid_cancel_target"), "doc should include invalid_cancel_target");
  assert.ok(content.includes("Operation Error Codes (v0)"), "doc should include operation error section");
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
