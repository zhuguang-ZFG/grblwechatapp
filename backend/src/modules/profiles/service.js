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
        }
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
        notes: row.notes
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

  return {
    listMachineProfiles,
    listMaterialProfiles,
    listFonts,
    listImageProcessors
  };
}

module.exports = {
  createProfilesService
};
