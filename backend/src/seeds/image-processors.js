function now() {
  return new Date().toISOString();
}

module.exports = [
  {
    id: "ip_001",
    name: "标准",
    type: "base",
    default_params_json: JSON.stringify({ threshold: 128, noiseReduction: 0 }),
    sort_order: 0,
    created_at: now()
  },
  {
    id: "ip_002",
    name: "边缘检测",
    type: "edge",
    default_params_json: JSON.stringify({ threshold: 80, noiseReduction: 1 }),
    sort_order: 1,
    created_at: now()
  },
  {
    id: "ip_003",
    name: "中心线",
    type: "centerline",
    default_params_json: JSON.stringify({ threshold: 100, noiseReduction: 2 }),
    sort_order: 2,
    created_at: now()
  },
  {
    id: "ip_004",
    name: "精细模式",
    type: "fine",
    default_params_json: JSON.stringify({ threshold: 160, noiseReduction: 0, dpi: 500 }),
    sort_order: 3,
    created_at: now()
  },
  {
    id: "ip_005",
    name: "高对比度",
    type: "high-contrast",
    default_params_json: JSON.stringify({ threshold: 60, noiseReduction: 3, contrast: 1.5 }),
    sort_order: 4,
    created_at: now()
  },
  {
    id: "ip_006",
    name: "素描效果",
    type: "sketch",
    default_params_json: JSON.stringify({ threshold: 100, noiseReduction: 1, lineWidth: 1 }),
    sort_order: 5,
    created_at: now()
  },
  {
    id: "ip_007",
    name: "浮雕效果",
    type: "emboss",
    default_params_json: JSON.stringify({ threshold: 120, noiseReduction: 0, depth: 3 }),
    sort_order: 6,
    created_at: now()
  },
  {
    id: "ip_008",
    name: "二值化",
    type: "binary",
    default_params_json: JSON.stringify({ threshold: 90, noiseReduction: 2, invert: false }),
    sort_order: 7,
    created_at: now()
  }
];
