const assert = require("assert");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");

const scriptPath = path.resolve(__dirname, "../scripts/wechat-devtools-stop-backend.ps1");

function run() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kxapp-stop-backend-"));
  const tempPidFilePath = path.join(tempDir, "backend.pid");
  fs.writeFileSync(tempPidFilePath, "43210", "utf8");

  const output = execFileSync(
    "powershell",
    [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-DryRun",
      "-PidFilePath",
      tempPidFilePath
    ],
    {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf8"
    }
  );

  assert.ok(output.includes("WeChat DevTools Stop Backend"), "should print script title");
  assert.ok(output.includes("Target PID: 43210"), "should print target pid");
  assert.ok(output.includes("Dry run only."), "should report dry run mode");
  assert.strictEqual(fs.readFileSync(tempPidFilePath, "utf8"), "43210", "dry run should not modify pid file");
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
