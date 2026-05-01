function now() {
  return new Date().toISOString();
}

module.exports = [
  {
    id: "mp_123",
    device_model: "esp32_grbl",
    name: "Default ESP32 GRBL",
    work_area_width_mm: 400,
    work_area_height_mm: 400,
    origin_mode: "bottom_left",
    supports_offline_print: 1,
    default_speed: 1200,
    default_power: 70,
    default_line_spacing: 1.0,
    created_at: now()
  },
  {
    id: "mp_124",
    device_model: "esp32_grbl",
    name: "Precision Mode",
    work_area_width_mm: 400,
    work_area_height_mm: 400,
    origin_mode: "center",
    supports_offline_print: 1,
    default_speed: 600,
    default_power: 50,
    default_line_spacing: 0.8,
    created_at: now()
  }
];
