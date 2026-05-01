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
  }
];
