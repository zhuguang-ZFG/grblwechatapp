function now() {
  return new Date().toISOString();
}

module.exports = [
  {
    id: "fnt_001",
    name: "默认黑体",
    family: "sans-serif",
    style: "regular",
    category: "sans-serif",
    preview_url: "",
    sort_order: 0,
    created_at: now()
  },
  {
    id: "fnt_002",
    name: "楷体",
    family: "KaiTi",
    style: "regular",
    category: "serif",
    preview_url: "",
    sort_order: 1,
    created_at: now()
  },
  {
    id: "fnt_003",
    name: "宋体",
    family: "SimSun",
    style: "regular",
    category: "serif",
    preview_url: "",
    sort_order: 2,
    created_at: now()
  },
  {
    id: "fnt_004",
    name: "仿宋",
    family: "FangSong",
    style: "regular",
    category: "serif",
    preview_url: "",
    sort_order: 3,
    created_at: now()
  },
  {
    id: "fnt_005",
    name: "粗体黑体",
    family: "sans-serif",
    style: "bold",
    category: "sans-serif",
    preview_url: "",
    sort_order: 4,
    created_at: now()
  },
  {
    id: "fnt_006",
    name: "圆体",
    family: "sans-serif",
    style: "round",
    category: "sans-serif",
    preview_url: "",
    sort_order: 5,
    created_at: now()
  }
];
