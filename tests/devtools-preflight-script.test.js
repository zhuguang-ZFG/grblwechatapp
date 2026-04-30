const assert = require("assert");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");

const scriptPath = path.resolve(__dirname, "../scripts/wechat-devtools-preflight.ps1");
const runlogTemplatePath = path.resolve(
  __dirname,
  "../docs/superpowers/plans/2026-05-01-kxapp-wechat-devtools-runlog.md"
);

function run() {
  const output = execFileSync(
    "powershell",
    [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-DryRun"
    ],
    {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf8"
    }
  );

  assert.ok(output.includes("WeChat DevTools Preflight"), "should print script title");
  assert.ok(output.includes("Current commit:"), "should print current commit");
  assert.ok(output.includes("backend\\scripts\\test.ps1"), "should mention backend test script");
  assert.ok(output.includes("node src/server.js"), "should mention backend server command");
  assert.ok(
    output.includes("docs\\superpowers\\plans\\2026-05-01-kxapp-wechat-devtools-checklist.md"),
    "should mention checklist path"
  );
  assert.ok(
    output.includes("docs\\superpowers\\plans\\2026-05-01-kxapp-wechat-devtools-runlog.md"),
    "should mention run log path"
  );

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kxapp-preflight-"));
  const tempRunlogPath = path.join(tempDir, "runlog.md");
  fs.copyFileSync(runlogTemplatePath, tempRunlogPath);

  execFileSync(
    "powershell",
    [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-DryRun",
      "-AppendRunLog",
      "-RunLogPath",
      tempRunlogPath,
      "-Operator",
      "Script Test"
    ],
    {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf8"
    }
  );

  const updatedRunlog = fs.readFileSync(tempRunlogPath, "utf8");
  assert.ok(updatedRunlog.includes("## Run "), "should append a run entry");
  assert.ok(updatedRunlog.includes("Script Test"), "should record operator");
  assert.ok(updatedRunlog.includes("Dry run preflight"), "should record dry run note");
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
