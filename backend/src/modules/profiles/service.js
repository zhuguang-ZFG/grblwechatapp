const crypto = require("crypto");

function now() {
  return new Date().toISOString();
}

function createProfilesService(app) {
  const db = app.db;

  function listMachineProfiles() {
    const rows = db.prepare("SELECT * FROM machine_profiles ORDER BY name ASC").all();
    return {
      items: rows.map((row) => ({
        id: row.id,
        deviceModel: row.device_model,
        name: row.name,
        workArea: {
          widthMm: row.work_area_width_mm,
          heightMm: row.work_area_height_mm
        },
        originMode: row.origin_mode,
        supportsOfflinePrint: Boolean(row.supports_offline_print),
        defaultParams: {
          speed: row.default_speed,
          power: row.default_power,
          lineSpacing: row.default_line_spacing
        },
        isSystem: !row.owner_user_id
      }))
    };
  }

  function listMaterialProfiles() {
    const rows = db.prepare("SELECT * FROM material_profiles ORDER BY name ASC").all();
    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        recommendedParams: {
          speed: row.recommended_speed,
          power: row.recommended_power,
          passes: row.recommended_passes
        },
        notes: row.notes,
        isSystem: !row.owner_user_id
      }))
    };
  }

  function listFonts() {
    const rows = db.prepare("SELECT * FROM fonts ORDER BY sort_order ASC").all();
    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        family: row.family,
        style: row.style,
        category: row.category,
        previewUrl: row.preview_url
      }))
    };
  }

  function listImageProcessors() {
    const rows = db.prepare("SELECT * FROM image_processors ORDER BY sort_order ASC").all();
    return {
      items: rows.map((row) => ({
        id: row.id,
        name: row.name,
        type: row.type,
        defaultParams: JSON.parse(row.default_params_json)
      }))
    };
  }

  function getMachineProfile(profileId) {
    const row = db.prepare("SELECT * FROM machine_profiles WHERE id = ?").get(profileId);
    if (!row) return null;
    return {
      id: row.id,
      deviceModel: row.device_model,
      name: row.name,
      workArea: {
        widthMm: row.work_area_width_mm,
        heightMm: row.work_area_height_mm
      },
      originMode: row.origin_mode,
      supportsOfflinePrint: Boolean(row.supports_offline_print),
      defaultParams: {
        speed: row.default_speed,
        power: row.default_power,
        lineSpacing: row.default_line_spacing
      },
      isSystem: !row.owner_user_id
    };
  }

  function getMaterialProfile(profileId) {
    const row = db.prepare("SELECT * FROM material_profiles WHERE id = ?").get(profileId);
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      recommendedParams: {
        speed: row.recommended_speed,
        power: row.recommended_power,
        passes: row.recommended_passes
      },
      notes: row.notes,
      isSystem: !row.owner_user_id
    };
  }

  function createMachineProfile(userId, payload) {
    const id = `mp_${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO machine_profiles (
        id, device_model, name, work_area_width_mm, work_area_height_mm,
        origin_mode, supports_offline_print, default_speed, default_power, default_line_spacing, owner_user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      payload.deviceModel || "esp32_grbl",
      payload.name || "自定义配置",
      payload.workAreaWidthMm || 400,
      payload.workAreaHeightMm || 400,
      payload.originMode || "bottom_left",
      payload.supportsOfflinePrint !== undefined ? (payload.supportsOfflinePrint ? 1 : 0) : 1,
      payload.defaultSpeed || 1200,
      payload.defaultPower || 70,
      payload.defaultLineSpacing || 1.0,
      userId,
      now()
    );
    return getMachineProfile(id);
  }

  function updateMachineProfile(userId, profileId, payload) {
    const existing = db.prepare("SELECT * FROM machine_profiles WHERE id = ? AND owner_user_id = ?").get(profileId, userId);
    if (!existing) return null;
    db.prepare(`
      UPDATE machine_profiles
      SET name = ?, work_area_width_mm = ?, work_area_height_mm = ?,
          origin_mode = ?, default_speed = ?, default_power = ?, default_line_spacing = ?
      WHERE id = ? AND owner_user_id = ?
    `).run(
      payload.name !== undefined ? payload.name : existing.name,
      payload.workAreaWidthMm !== undefined ? payload.workAreaWidthMm : existing.work_area_width_mm,
      payload.workAreaHeightMm !== undefined ? payload.workAreaHeightMm : existing.work_area_height_mm,
      payload.originMode !== undefined ? payload.originMode : existing.origin_mode,
      payload.defaultSpeed !== undefined ? payload.defaultSpeed : existing.default_speed,
      payload.defaultPower !== undefined ? payload.defaultPower : existing.default_power,
      payload.defaultLineSpacing !== undefined ? payload.defaultLineSpacing : existing.default_line_spacing,
      profileId,
      userId
    );
    return getMachineProfile(profileId);
  }

  function deleteMachineProfile(userId, profileId) {
    const result = db.prepare("DELETE FROM machine_profiles WHERE id = ? AND owner_user_id = ?").run(profileId, userId);
    return result.changes > 0 ? { deleted: true } : null;
  }

  function createMaterialProfile(userId, payload) {
    const id = `mat_${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO material_profiles (
        id, name, category, recommended_speed, recommended_power, recommended_passes, notes, owner_user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      payload.name || "自定义材质",
      payload.category || "自定义",
      payload.recommendedSpeed || 1000,
      payload.recommendedPower || 65,
      payload.recommendedPasses || 1,
      payload.notes || "",
      userId,
      now()
    );
    return getMaterialProfile(id);
  }

  function updateMaterialProfile(userId, profileId, payload) {
    const existing = db.prepare("SELECT * FROM material_profiles WHERE id = ? AND owner_user_id = ?").get(profileId, userId);
    if (!existing) return null;
    db.prepare(`
      UPDATE material_profiles
      SET name = ?, category = ?, recommended_speed = ?, recommended_power = ?, recommended_passes = ?, notes = ?
      WHERE id = ? AND owner_user_id = ?
    `).run(
      payload.name !== undefined ? payload.name : existing.name,
      payload.category !== undefined ? payload.category : existing.category,
      payload.recommendedSpeed !== undefined ? payload.recommendedSpeed : existing.recommended_speed,
      payload.recommendedPower !== undefined ? payload.recommendedPower : existing.recommended_power,
      payload.recommendedPasses !== undefined ? payload.recommendedPasses : existing.recommended_passes,
      payload.notes !== undefined ? payload.notes : existing.notes,
      profileId,
      userId
    );
    return getMaterialProfile(profileId);
  }

  function deleteMaterialProfile(userId, profileId) {
    const result = db.prepare("DELETE FROM material_profiles WHERE id = ? AND owner_user_id = ?").run(profileId, userId);
    return result.changes > 0 ? { deleted: true } : null;
  }

  return {
    listMachineProfiles,
    listMaterialProfiles,
    listFonts,
    listImageProcessors,
    getMachineProfile,
    getMaterialProfile,
    createMachineProfile,
    updateMachineProfile,
    deleteMachineProfile,
    createMaterialProfile,
    updateMaterialProfile,
    deleteMaterialProfile
  };
}

module.exports = {
  createProfilesService
};
