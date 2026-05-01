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

    const metrics = JSON.parse(row.metrics_json);
    const result = {
      id: row.id,
      status: row.status,
      previewImageUrl: row.preview_image_url,
      previewSvgUrl: row.preview_svg_url,
      metrics,
      warnings: JSON.parse(row.warnings_json)
    };

    // Compute comparison with previous preview for the same project
    if (row.project_id && row.status === "ready") {
      const prev = db.prepare(`
        SELECT id, metrics_json FROM previews
        WHERE project_id = ? AND id != ? AND status = 'ready'
        ORDER BY created_at DESC LIMIT 1
      `).get(row.project_id, row.id);

      if (prev) {
        const prevMetrics = JSON.parse(prev.metrics_json);
        const changes = {};
        let changeCount = 0;

        for (const key of Object.keys(metrics)) {
          if (typeof metrics[key] === "number" && typeof prevMetrics[key] === "number" && metrics[key] !== prevMetrics[key]) {
            const delta = metrics[key] - prevMetrics[key];
            changes[key] = { from: prevMetrics[key], to: metrics[key], delta };
            changeCount++;
          }
        }

        result.comparison = {
          previousPreviewId: prev.id,
          changes,
          summary: changeCount > 0
            ? `相比上一版本，${Object.entries(changes).map(([k, v]) => {
                const labels = { pathCount: "路径数", estimatedDurationSec: "预计时间", widthMm: "宽度", heightMm: "高度" };
                return `${labels[k] || k} ${v.delta > 0 ? "+" : ""}${v.delta}`;
              }).join("，")}`
            : "与上一版本一致"
        };
      }
    }

    return result;
  }

  return {
    createPreview,
    getPreview
  };
}

module.exports = {
  createPreviewsService
};
