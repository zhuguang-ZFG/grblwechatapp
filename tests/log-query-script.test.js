const assert = require("assert");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { execFileSync } = require("child_process");

const scriptPath = path.resolve(__dirname, "../scripts/log-query.ps1");

function run() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "kxapp-log-query-"));
  const tempLogPath = path.join(tempDir, "backend.log");
  const lines = [
    '{"at":"2026-05-02T02:00:00.000Z","level":"info","component":"jobs","event":"job_created","traceId":"trace_a","jobId":"job_1","deviceId":"dev_123"}',
    "plain text line",
    '{"at":"2026-05-02T02:00:01.000Z","level":"warn","component":"gateway","event":"gateway_auth_rejected","deviceId":"dev_999"}',
    '{"at":"2026-05-02T02:00:02.000Z","level":"info","component":"gateway","event":"gateway_job_enqueued","traceId":"trace_a","jobId":"job_1","deviceId":"dev_123"}'
  ];
  fs.writeFileSync(tempLogPath, lines.join("\n"), "utf8");

  const byTrace = execFileSync(
    "powershell",
    [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-LogPath",
      tempLogPath,
      "-TraceId",
      "trace_a"
    ],
    {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf8"
    }
  );
  assert.ok(byTrace.includes("Matched events: 2"), "trace filter should match two events");
  assert.ok(byTrace.includes('"event":"job_created"'), "trace filter should include job_created");
  assert.ok(byTrace.includes('"event":"gateway_job_enqueued"'), "trace filter should include gateway_job_enqueued");

  const byLevel = execFileSync(
    "powershell",
    [
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-LogPath",
      tempLogPath,
      "-Level",
      "warn"
    ],
    {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf8"
    }
  );
  assert.ok(byLevel.includes("Matched events: 1"), "level filter should match one event");
  assert.ok(byLevel.includes('"event":"gateway_auth_rejected"'), "warn filter should include auth rejection");
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
