const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { applySchema } = require("./schema");
const seedDevices = require("../../seeds/devices");

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function createDatabase(databaseFile) {
  ensureParentDir(databaseFile);
  const db = new Database(databaseFile);
  applySchema(db);

  const insertDevice = db.prepare(`
    INSERT OR IGNORE INTO devices (
      id, name, model, serial_no, owner_user_id, bind_status, online_status, binding_code, last_seen_at
    ) VALUES (
      @id, @name, @model, @serial_no, '', @bind_status, @online_status, @binding_code, @last_seen_at
    )
  `);

  seedDevices.forEach((device) => insertDevice.run(device));
  return db;
}

module.exports = {
  createDatabase
};
