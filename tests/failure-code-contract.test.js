const assert = require("assert");
const path = require("path");

const backendFailureCodesPath = path.resolve(__dirname, "../backend/src/modules/jobs/failure-codes.js");
const taskDetailPagePath = path.resolve(__dirname, "../miniprogram/pages/tasks/detail/index.js");

function run() {
  delete require.cache[backendFailureCodesPath];
  delete require.cache[taskDetailPagePath];

  global.Page = function noop() {};

  const { FAILURE_CODE_MAP } = require(backendFailureCodesPath);
  const { FAILURE_SUGGESTION_MAP } = require(taskDetailPagePath);

  const backendCodes = Object.keys(FAILURE_CODE_MAP);
  const missingSuggestionCodes = backendCodes.filter((code) => !FAILURE_SUGGESTION_MAP[code]);

  assert.deepStrictEqual(
    missingSuggestionCodes,
    [],
    `Missing frontend suggestion mapping for backend codes: ${missingSuggestionCodes.join(", ")}`
  );
}

try {
  run();
} catch (error) {
  console.error(error);
  process.exit(1);
}
