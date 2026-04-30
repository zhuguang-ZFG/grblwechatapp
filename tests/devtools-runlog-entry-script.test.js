const assert = require("assert");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");

const scriptPath = path.resolve(__dirname, "../scripts/wechat-devtools-new-runlog-entry.ps1");
const runlogTemplatePath = path.resolve(
  __dirname,
  "../docs/superpowers/plans/2026-05-01-kxapp-wechat-devtools-runlog.md"
);

function run() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kxapp-runlog-entry-"));
  const tempRunlogPath = path.join(tempDir, "runlog.md");
  fs.copyFileSync(runlogTemplatePath, tempRunlogPath);

  const output = execFileSync(
    "powershell",
    [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-RunLogPath",
      tempRunlogPath,
      "-Operator",
      "Smoke Runner"
    ],
    {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf8"
    }
  );

  assert.ok(output.includes("WeChat DevTools Run Log Entry"), "should print script title");
  assert.ok(output.includes("Smoke Runner"), "should print operator");
  assert.ok(output.includes("Entry appended to:"), "should print run log path");

  const updatedRunlog = fs.readFileSync(tempRunlogPath, "utf8");
  assert.ok(updatedRunlog.includes("## Run "), "should append a run entry");
  assert.ok(updatedRunlog.includes("Smoke Runner"), "should record operator");
  assert.ok(updatedRunlog.includes("PASS / PARTIAL / FAIL / SKIP"), "should keep manual status placeholders");
  assert.ok(updatedRunlog.includes("storage cleared before run:"), "should include devtools checklist fields");
  assert.ok(updatedRunlog.includes("issue 1:"), "should include issue template");
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
