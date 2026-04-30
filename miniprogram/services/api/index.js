const env = require("../../config/env");
const mockAdapter = require("../../utils/mock-api");
const realAdapter = require("./real-adapter");

module.exports = env.useMock ? mockAdapter : realAdapter;
