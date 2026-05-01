const crypto = require("crypto");

function now() {
  return new Date().toISOString();
}

function toTemplateView(row) {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    description: row.description,
    sourceType: row.source_type,
    category: row.category,
    content: JSON.parse(row.content_json),
    layout: JSON.parse(row.layout_json),
    processParams: JSON.parse(row.process_params_json),
    previewImageUrl: row.preview_image_url,
    isSystem: !row.owner_user_id
  };
}

function createTemplatesService(app) {
  const db = app.db;

  function listTemplates(category) {
    let sql = "SELECT * FROM templates";
    const params = [];
    if (category) {
      sql += " WHERE category = ?";
      params.push(category);
    }
    sql += " ORDER BY sort_order ASC, created_at DESC";
    const rows = params.length ? db.prepare(sql).all(...params) : db.prepare(sql).all();
    return {
      items: rows.map(toTemplateView)
    };
  }

  function getTemplate(templateId) {
    const row = db.prepare("SELECT * FROM templates WHERE id = ?").get(templateId);
    return row ? toTemplateView(row) : null;
  }

  function createTemplate(userId, payload) {
    const id = `tpl_${crypto.randomUUID().slice(0, 8)}`;
    const createdAt = now();
    db.prepare(`
      INSERT INTO templates (
        id, owner_user_id, name, description, source_type, category,
        content_json, layout_json, process_params_json, preview_image_url, sort_order, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', 99, ?)
    `).run(
      id,
      userId,
      payload.name || "自定义模板",
      payload.description || "",
      payload.sourceType || "text",
      payload.category || "自定义",
      JSON.stringify(payload.content || { text: "", imageAssetId: null }),
      JSON.stringify(payload.layout || { widthMm: 80, heightMm: 50, rotationDeg: 0, align: "center" }),
      JSON.stringify(payload.processParams || { speed: 1000, power: 65, passes: 1, lineSpacing: 1.0 }),
      createdAt
    );
    return getTemplate(id);
  }

  function updateTemplate(userId, templateId, payload) {
    const existing = db.prepare("SELECT * FROM templates WHERE id = ? AND owner_user_id = ?").get(templateId, userId);
    if (!existing) return null;

    const next = {
      name: payload.name !== undefined ? payload.name : existing.name,
      description: payload.description !== undefined ? payload.description : existing.description,
      sourceType: payload.sourceType !== undefined ? payload.sourceType : existing.source_type,
      category: payload.category !== undefined ? payload.category : existing.category,
      content: payload.content !== undefined ? payload.content : JSON.parse(existing.content_json),
      layout: payload.layout !== undefined ? payload.layout : JSON.parse(existing.layout_json),
      processParams: payload.processParams !== undefined ? payload.processParams : JSON.parse(existing.process_params_json)
    };

    db.prepare(`
      UPDATE templates
      SET name = ?, description = ?, source_type = ?, category = ?,
          content_json = ?, layout_json = ?, process_params_json = ?
      WHERE id = ? AND owner_user_id = ?
    `).run(
      next.name, next.description, next.sourceType, next.category,
      JSON.stringify(next.content), JSON.stringify(next.layout), JSON.stringify(next.processParams),
      templateId, userId
    );

    return getTemplate(templateId);
  }

  function deleteTemplate(userId, templateId) {
    const result = db.prepare("DELETE FROM templates WHERE id = ? AND owner_user_id = ?").run(templateId, userId);
    return result.changes > 0 ? { deleted: true } : null;
  }

  function applyTemplate(userId, templateId) {
    const template = getTemplate(templateId);
    if (!template) return null;

    const projectId = `prj_${crypto.randomUUID().slice(0, 8)}`;
    const createdAt = now();

    db.prepare(`
      INSERT INTO projects (
        id, owner_user_id, name, source_type, status, selected_device_id,
        machine_profile_id, material_profile_id,
        content_json, layout_json, process_params_json, latest_preview_id,
        latest_generation_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, ?)
    `).run(
      projectId,
      userId,
      template.name,
      template.sourceType,
      "draft",
      "",
      "",
      "",
      JSON.stringify(template.content),
      JSON.stringify(template.layout),
      JSON.stringify(template.processParams),
      createdAt,
      createdAt
    );

    return { id: projectId, status: "draft" };
  }

  return {
    listTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate
  };
}

module.exports = {
  createTemplatesService
};
