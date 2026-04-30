const assert = require("assert");
const path = require("path");
const fs = require("fs");

const backendFailureCodesPath = path.resolve(__dirname, "../backend/src/modules/jobs/failure-codes.js");
const docPath = path.resolve(
  __dirname,
  "../docs/superpowers/specs/2026-05-01-kxapp-failure-codes-v0.md"
);

function run() {
  delete require.cache[backendFailureCodesPath];
  const { FAILURE_CODE_MAP } = require(backendFailureCodesPath);
  const content = fs.readFileSync(docPath, "utf8");

  const backendCodes = Object.keys(FAILURE_CODE_MAP);
  const missingInDoc = backendCodes.filter((code) => !content.includes(`\`${code}\``));

  assert.deepStrictEqual(
    missingInDoc,
    [],
    `Document missing failure code entries: ${missingInDoc.join(", ")}`
  );
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
