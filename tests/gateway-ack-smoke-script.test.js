const assert = require("assert");
const path = require("path");
const { execFileSync } = require("child_process");

const scriptPath = path.resolve(__dirname, "../scripts/gateway-ack-smoke.js");

function run() {
  const output = execFileSync(
    "node",
    [scriptPath],
    {
      cwd: path.resolve(__dirname, ".."),
      encoding: "utf8"
    }
  );
  assert.ok(output.includes("Gateway ACK smoke passed."), "smoke script should finish successfully");
  assert.ok(output.includes("jobId=job_"), "smoke script should output job id");
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
