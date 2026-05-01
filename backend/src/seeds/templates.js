function now() {
  return new Date().toISOString();
}

module.exports = [
  {
    id: "tpl_001",
    owner_user_id: "",
    name: "母亲节纪念牌",
    description: "典雅的中文排版，适合母亲节礼物雕刻，预设了心形装饰文本布局。",
    source_type: "text",
    category: "礼品",
    content_json: JSON.stringify({ text: "妈妈\n我爱您", fontId: "fnt_001", fontSize: 120, lineGap: 20, imageAssetId: null, processorPresetId: null }),
    layout_json: JSON.stringify({ widthMm: 100, heightMm: 70, rotationDeg: 0, align: "center" }),
    process_params_json: JSON.stringify({ speed: 800, power: 70, passes: 1, lineSpacing: 0.8 }),
    preview_image_url: "",
    sort_order: 0,
    created_at: now()
  },
  {
    id: "tpl_002",
    owner_user_id: "",
    name: "店铺招牌",
    description: "加粗醒目的店铺名称排版，适合木质或亚克力招牌雕刻。",
    source_type: "text",
    category: "标牌",
    content_json: JSON.stringify({ text: "欢迎光临", fontId: "fnt_005", fontSize: 150, lineGap: 0, imageAssetId: null, processorPresetId: null }),
    layout_json: JSON.stringify({ widthMm: 200, heightMm: 80, rotationDeg: 0, align: "center" }),
    process_params_json: JSON.stringify({ speed: 600, power: 80, passes: 2, lineSpacing: 1.0 }),
    preview_image_url: "",
    sort_order: 1,
    created_at: now()
  },
  {
    id: "tpl_003",
    owner_user_id: "",
    name: "名言书签",
    description: "细长的书签尺寸，楷体排版名言警句，适合皮质或木质书签。",
    source_type: "text",
    category: "工艺",
    content_json: JSON.stringify({ text: "学而不思则罔", fontId: "fnt_002", fontSize: 80, lineGap: 10, imageAssetId: null, processorPresetId: null }),
    layout_json: JSON.stringify({ widthMm: 40, heightMm: 120, rotationDeg: 0, align: "center" }),
    process_params_json: JSON.stringify({ speed: 1000, power: 60, passes: 1, lineSpacing: 0.6 }),
    preview_image_url: "",
    sort_order: 2,
    created_at: now()
  },
  {
    id: "tpl_004",
    owner_user_id: "",
    name: "皮具定制Logo",
    description: "图片转雕刻预设，适合在皮革表面雕刻品牌标志或图案。",
    source_type: "image",
    category: "礼品",
    content_json: JSON.stringify({ text: "", imageAssetId: null, fontId: "fnt_001", fontSize: 100, lineGap: 0, processorPresetId: "ip_002" }),
    layout_json: JSON.stringify({ widthMm: 60, heightMm: 60, rotationDeg: 0, align: "center" }),
    process_params_json: JSON.stringify({ speed: 1500, power: 40, passes: 1, lineSpacing: 1.0 }),
    preview_image_url: "",
    sort_order: 3,
    created_at: now()
  },
  {
    id: "tpl_005",
    owner_user_id: "",
    name: "装饰画心形图案",
    description: "心形图片轮廓雕刻，适合木板或亚克力装饰画制作。",
    source_type: "image",
    category: "工艺",
    content_json: JSON.stringify({ text: "", imageAssetId: null, fontId: "fnt_001", fontSize: 100, lineGap: 0, processorPresetId: "ip_001" }),
    layout_json: JSON.stringify({ widthMm: 150, heightMm: 150, rotationDeg: 0, align: "center" }),
    process_params_json: JSON.stringify({ speed: 800, power: 75, passes: 1, lineSpacing: 1.0 }),
    preview_image_url: "",
    sort_order: 4,
    created_at: now()
  },
  {
    id: "tpl_006",
    owner_user_id: "",
    name: "亚克力标识牌",
    description: "边缘检测图片处理预设，适合亚克力板材的标识牌制作。",
    source_type: "image",
    category: "标牌",
    content_json: JSON.stringify({ text: "", imageAssetId: null, fontId: "fnt_001", fontSize: 100, lineGap: 0, processorPresetId: "ip_003" }),
    layout_json: JSON.stringify({ widthMm: 180, heightMm: 100, rotationDeg: 0, align: "center" }),
    process_params_json: JSON.stringify({ speed: 300, power: 90, passes: 3, lineSpacing: 1.0 }),
    preview_image_url: "",
    sort_order: 5,
    created_at: now()
  }
];
