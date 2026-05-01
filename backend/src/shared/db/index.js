const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { applySchema } = require("./schema");
const seedDevices = require("../../seeds/devices");
const seedMachineProfiles = require("../../seeds/machine-profiles");
const seedMaterialProfiles = require("../../seeds/material-profiles");
const seedFonts = require("../../seeds/fonts");
const seedImageProcessors = require("../../seeds/image-processors");
const seedTemplates = require("../../seeds/templates");

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

  const insertMachineProfile = db.prepare(`
    INSERT OR IGNORE INTO machine_profiles (
      id, device_model, name, work_area_width_mm, work_area_height_mm, origin_mode,
      supports_offline_print, default_speed, default_power, default_line_spacing, owner_user_id, created_at
    ) VALUES (
      @id, @device_model, @name, @work_area_width_mm, @work_area_height_mm, @origin_mode,
      @supports_offline_print, @default_speed, @default_power, @default_line_spacing, '', @created_at
    )
  `);

  seedMachineProfiles.forEach((profile) => insertMachineProfile.run(profile));

  const insertMaterialProfile = db.prepare(`
    INSERT OR IGNORE INTO material_profiles (
      id, name, category, recommended_speed, recommended_power, recommended_passes, notes, owner_user_id, created_at
    ) VALUES (
      @id, @name, @category, @recommended_speed, @recommended_power, @recommended_passes, @notes, '', @created_at
    )
  `);

  seedMaterialProfiles.forEach((profile) => insertMaterialProfile.run(profile));

  const insertFont = db.prepare(`
    INSERT OR IGNORE INTO fonts (
      id, name, family, style, category, preview_url, sort_order, created_at
    ) VALUES (
      @id, @name, @family, @style, @category, @preview_url, @sort_order, @created_at
    )
  `);

  seedFonts.forEach((font) => insertFont.run(font));

  const insertImageProcessor = db.prepare(`
    INSERT OR IGNORE INTO image_processors (
      id, name, type, default_params_json, sort_order, created_at
    ) VALUES (
      @id, @name, @type, @default_params_json, @sort_order, @created_at
    )
  `);

  seedImageProcessors.forEach((ip) => insertImageProcessor.run(ip));

  const insertTemplate = db.prepare(`
    INSERT OR IGNORE INTO templates (
      id, owner_user_id, name, description, source_type, category, content_json, layout_json,
      process_params_json, preview_image_url, sort_order, created_at
    ) VALUES (
      @id, @owner_user_id, @name, @description, @source_type, @category, @content_json, @layout_json,
      @process_params_json, @preview_image_url, @sort_order, @created_at
    )
  `);

  seedTemplates.forEach((tpl) => insertTemplate.run(tpl));

  return db;
}

module.exports = {
  createDatabase
};
