const crypto = require("crypto");

function now() {
  return new Date().toISOString();
}

function toProjectView(row) {
  return {
    id: row.id,
    name: row.name,
    sourceType: row.source_type,
    status: row.status,
    selectedDeviceId: row.selected_device_id || "",
    content: JSON.parse(row.content_json),
    layout: JSON.parse(row.layout_json),
    processParams: JSON.parse(row.process_params_json),
    latestPreviewId: row.latest_preview_id || "",
    latestGenerationId: row.latest_generation_id || "",
    updatedAt: row.updated_at
  };
}

function createProjectsService(app) {
  const db = app.db;

  function createProject(userId, payload) {
    const id = `prj_${crypto.randomUUID().slice(0, 8)}`;
    const createdAt = now();
    db.prepare(`
      INSERT INTO projects (
        id, owner_user_id, name, source_type, status, selected_device_id,
        content_json, layout_json, process_params_json, latest_preview_id,
        latest_generation_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, ?)
    `).run(
      id,
      userId,
      payload.name,
      payload.sourceType,
      "draft",
      payload.selectedDeviceId || "",
      JSON.stringify(payload.content || { text: "", imageAssetId: null }),
      JSON.stringify(payload.layout || { widthMm: 80, heightMm: 50 }),
      JSON.stringify(payload.processParams || { speed: 1000, power: 65 }),
      createdAt,
      createdAt
    );

    return {
      id,
      status: "draft"
    };
  }

  function listProjects(userId) {
    const items = db.prepare(`
      SELECT * FROM projects
      WHERE owner_user_id = ?
      ORDER BY updated_at DESC
    `).all(userId);

    return {
      items: items.map(toProjectView),
      page: 1,
      pageSize: items.length,
      total: items.length
    };
  }

  function getProject(userId, projectId) {
    const row = db.prepare(`
      SELECT * FROM projects WHERE id = ? AND owner_user_id = ?
    `).get(projectId, userId);

    return row ? toProjectView(row) : null;
  }

  function updateProject(userId, projectId, payload) {
    const existing = getProject(userId, projectId);
    if (!existing) {
      return null;
    }

    const next = {
      name: payload.name || existing.name,
      sourceType: payload.sourceType || existing.sourceType,
      selectedDeviceId: payload.selectedDeviceId || existing.selectedDeviceId,
      content: payload.content || existing.content,
      layout: payload.layout || existing.layout,
      processParams: payload.processParams || existing.processParams
    };

    db.prepare(`
      UPDATE projects
      SET name = ?, source_type = ?, selected_device_id = ?, content_json = ?, layout_json = ?, process_params_json = ?, updated_at = ?
      WHERE id = ? AND owner_user_id = ?
    `).run(
      next.name,
      next.sourceType,
      next.selectedDeviceId,
      JSON.stringify(next.content),
      JSON.stringify(next.layout),
      JSON.stringify(next.processParams),
      now(),
      projectId,
      userId
    );

    return getProject(userId, projectId);
  }

  function duplicateProject(userId, projectId) {
    const existing = getProject(userId, projectId);
    if (!existing) {
      return null;
    }
    const duplicated = createProject(userId, {
      name: `${existing.name} Copy`,
      sourceType: existing.sourceType,
      selectedDeviceId: existing.selectedDeviceId,
      content: existing.content,
      layout: existing.layout,
      processParams: existing.processParams
    });
    return getProject(userId, duplicated.id);
  }

  function archiveProject(userId, projectId) {
    const existing = getProject(userId, projectId);
    if (!existing) {
      return null;
    }
    db.prepare(`
      UPDATE projects
      SET status = ?, updated_at = ?
      WHERE id = ? AND owner_user_id = ?
    `).run("archived", now(), projectId, userId);
    return getProject(userId, projectId);
  }

  function deleteProject(userId, projectId) {
    const existing = getProject(userId, projectId);
    if (!existing) {
      return null;
    }
    db.prepare("DELETE FROM projects WHERE id = ? AND owner_user_id = ?").run(projectId, userId);
    return { deleted: true };
  }

  return {
    createProject,
    listProjects,
    getProject,
    updateProject,
    duplicateProject,
    archiveProject,
    deleteProject
  };
}

module.exports = {
  createProjectsService
};
