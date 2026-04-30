const path = require("path");

module.exports = {
  port: Number(process.env.PORT || 3100),
  host: process.env.HOST || "127.0.0.1",
  databaseFile: process.env.DATABASE_FILE || path.join(__dirname, "../../data/kxapp.db"),
  storageDir: process.env.STORAGE_DIR || path.join(__dirname, "../../storage")
};
