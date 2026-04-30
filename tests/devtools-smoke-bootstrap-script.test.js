const assert = require("assert");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");

const scriptPath = path.resolve(__dirname, "../scripts/wechat-devtools-smoke-bootstrap.ps1");
const runlogTemplatePath = path.resolve(
  __dirname,
  "../docs/superpowers/plans/2026-05-01-kxapp-wechat-devtools-runlog.md"
);

function run() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kxapp-smoke-bootstrap-"));
  const tempRunlogPath = path.join(tempDir, "runlog.md");
  fs.copyFileSync(runlogTemplatePath, tempRunlogPath);

  const output = execFileSync(
    "powershell",
    [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-DryRun",
      "-RunLogPath",
      tempRunlogPath,
      "-Operator",
      "Bootstrap Test"
    ],
    {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf8"
    }
  );

  assert.ok(output.includes("WeChat DevTools Smoke Bootstrap"), "should print script title");
  assert.ok(output.includes("Bootstrap Test"), "should print operator");
  assert.ok(output.includes("Backend PID file:"), "should print backend pid file path");
  assert.ok(output.includes("Run log template entry appended."), "should append run log entry");
  assert.ok(output.includes("Dry run only."), "should report dry run mode");

  const updatedRunlog = fs.readFileSync(tempRunlogPath, "utf8");
  assert.ok(updatedRunlog.includes("Bootstrap Test"), "should record operator in run log");
  assert.ok(updatedRunlog.includes("PASS / PARTIAL / FAIL / SKIP"), "should preserve manual placeholders");
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
