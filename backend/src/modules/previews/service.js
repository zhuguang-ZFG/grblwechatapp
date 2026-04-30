const crypto = require("crypto");

function now() {
  return new Date().toISOString();
}

function createPreviewsService(app) {
  const db = app.db;

  function createPreview(userId, projectId) {
    const project = db.prepare("SELECT * FROM projects WHERE id = ? AND owner_user_id = ?").get(projectId, userId);
    if (!project) {
      return null;
    }

    const previewId = `pre_${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO previews (id, project_id, status, preview_image_url, preview_svg_url, metrics_json, warnings_json, created_at)
      VALUES (?, ?, 'processing', '', '', '{}', '[]', ?)
    `).run(previewId, projectId, now());

    db.prepare("UPDATE projects SET latest_preview_id = ?, updated_at = ? WHERE id = ?")
      .run(previewId, now(), projectId);

    app.workerRuntime.enqueue(async () => {
      app.workerTasks.completePreview(previewId);
    });

    return {
      previewId,
      status: "processing"
    };
  }

  function getPreview(previewId) {
    const row = db.prepare("SELECT * FROM previews WHERE id = ?").get(previewId);
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      status: row.status,
      previewImageUrl: row.preview_image_url,
      previewSvgUrl: row.preview_svg_url,
      metrics: JSON.parse(row.metrics_json),
      warnings: JSON.parse(row.warnings_json)
    };
  }

  return {
    createPreview,
    getPreview
  };
}

module.exports = {
  createPreviewsService
};
