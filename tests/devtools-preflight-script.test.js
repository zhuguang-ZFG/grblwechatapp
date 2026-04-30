const assert = require("assert");
const path = require("path");
const { execFileSync } = require("child_process");

const scriptPath = path.resolve(__dirname, "../scripts/wechat-devtools-preflight.ps1");

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
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
