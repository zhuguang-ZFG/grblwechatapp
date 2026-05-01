const path = require("path");

module.exports = {
  port: Number(process.env.PORT || 3100),
  host: process.env.HOST || "127.0.0.1",
  databaseFile: process.env.DATABASE_FILE || path.join(__dirname, "../../data/kxapp.db"),
  storageDir: process.env.STORAGE_DIR || path.join(__dirname, "../../storage"),
  gatewayDispatchLeaseMs: Number(process.env.GATEWAY_DISPATCH_LEASE_MS || 15000),
  gatewayHeartbeatStaleMs: Number(process.env.GATEWAY_HEARTBEAT_STALE_MS || 60000)
};
