const crypto = require("crypto");
const { GENERATION } = require("../../shared/constants/statuses");

function now() {
  return new Date().toISOString();
}

function createGenerationsService(app) {
  const db = app.db;

  function createGeneration(userId, projectId, previewId) {
    const project = db.prepare("SELECT * FROM projects WHERE id = ? AND owner_user_id = ?").get(projectId, userId);
    const preview = db.prepare("SELECT * FROM previews WHERE id = ? AND project_id = ?").get(previewId, projectId);
    if (!project || !preview) {
      return null;
    }

    const generationId = `gen_${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(`
      INSERT INTO generations (id, project_id, preview_id, status, summary_json, gcode_asset_path, path_asset_path, created_at)
      VALUES (?, ?, ?, ?, '{}', '', '', ?)
    `).run(generationId, projectId, previewId, GENERATION.PROCESSING, now());

    db.prepare("UPDATE projects SET latest_generation_id = ?, updated_at = ? WHERE id = ?")
      .run(generationId, now(), projectId);

    app.workerRuntime.enqueue(async () => {
      app.workerTasks.completeGeneration(generationId);
    });

    return {
      generationId,
      status: GENERATION.PROCESSING
    };
  }

  function getGeneration(generationId) {
    const row = db.prepare("SELECT * FROM generations WHERE id = ?").get(generationId);
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      status: row.status,
      summary: JSON.parse(row.summary_json)
    };
  }

  // Stale processing detection: fail if processing > 5 minutes
  const processingTimer = setInterval(() => {
    const deadline = new Date(Date.now() - 300000).toISOString();
    db.prepare(`
      UPDATE generations SET status = ?
      WHERE status = ? AND created_at < ?
    `).run(GENERATION.FAILED, GENERATION.PROCESSING, deadline);
  }, 60000);

  function close() {
    clearInterval(processingTimer);
  }

  return {
    createGeneration,
    getGeneration,
    close
  };
}

module.exports = {
  createGenerationsService
};
