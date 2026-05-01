function applySchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      wechat_open_id TEXT UNIQUE,
      nickname TEXT NOT NULL,
      avatar_url TEXT DEFAULT '',
      mobile TEXT DEFAULT '',
      profile_status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS temp_auth_sessions (
      token TEXT PRIMARY KEY,
      wechat_open_id TEXT NOT NULL,
      profile_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      serial_no TEXT NOT NULL,
      owner_user_id TEXT DEFAULT '',
      bind_status TEXT NOT NULL,
      online_status TEXT NOT NULL,
      binding_code TEXT NOT NULL UNIQUE,
      machine_profile_id TEXT DEFAULT '',
      last_seen_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS machine_profiles (
      id TEXT PRIMARY KEY,
      device_model TEXT NOT NULL,
      name TEXT NOT NULL,
      work_area_width_mm REAL NOT NULL,
      work_area_height_mm REAL NOT NULL,
      origin_mode TEXT DEFAULT 'bottom_left',
      supports_offline_print INTEGER DEFAULT 1,
      default_speed REAL DEFAULT 1200,
      default_power REAL DEFAULT 70,
      default_line_spacing REAL DEFAULT 1.0,
      owner_user_id TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS material_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT DEFAULT '',
      recommended_speed REAL DEFAULT 1000,
      recommended_power REAL DEFAULT 65,
      recommended_passes INTEGER DEFAULT 1,
      notes TEXT DEFAULT '',
      owner_user_id TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      status TEXT NOT NULL,
      selected_device_id TEXT DEFAULT '',
      machine_profile_id TEXT DEFAULT '',
      material_profile_id TEXT DEFAULT '',
      content_json TEXT NOT NULL,
      layout_json TEXT NOT NULL,
      process_params_json TEXT NOT NULL,
      latest_preview_id TEXT DEFAULT '',
      latest_generation_id TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS previews (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      status TEXT NOT NULL,
      preview_image_url TEXT DEFAULT '',
      preview_svg_url TEXT DEFAULT '',
      metrics_json TEXT NOT NULL,
      warnings_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      preview_id TEXT NOT NULL,
      status TEXT NOT NULL,
      summary_json TEXT NOT NULL,
      gcode_asset_path TEXT DEFAULT '',
      path_asset_path TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      generation_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      status TEXT NOT NULL,
      progress_json TEXT NOT NULL,
      failure_json TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS job_events (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      status TEXT NOT NULL,
      at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fonts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      family TEXT NOT NULL,
      style TEXT DEFAULT 'regular',
      category TEXT DEFAULT 'sans-serif',
      preview_url TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS image_processors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      default_params_json TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      owner_user_id TEXT DEFAULT '',
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      source_type TEXT NOT NULL,
      category TEXT DEFAULT '',
      content_json TEXT NOT NULL,
      layout_json TEXT NOT NULL,
      process_params_json TEXT NOT NULL,
      preview_image_url TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `);
}

module.exports = {
  applySchema
};
