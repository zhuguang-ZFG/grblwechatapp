function now() {
  return new Date().toISOString();
}

function createWorkerTasks(app) {
  const db = app.db;
  const artifacts = app.artifacts;

  function completePreview(previewId) {
    artifacts.writeText(`previews/${previewId}.txt`, `Preview ready for ${previewId}`);
    artifacts.writeText(`previews/${previewId}.svg`, `<svg xmlns="http://www.w3.org/2000/svg"></svg>`);

    db.prepare(`
      UPDATE previews
      SET status = ?, preview_image_url = ?, preview_svg_url = ?, metrics_json = ?, warnings_json = ?
      WHERE id = ?
    `).run(
      "ready",
      `/storage/previews/${previewId}.txt`,
      `/storage/previews/${previewId}.svg`,
      JSON.stringify({ widthMm: 80, heightMm: 50, pathCount: 126, estimatedDurationSec: 420 }),
      JSON.stringify([]),
      previewId
    );
  }

  function completeGeneration(generationId) {
    artifacts.writeText(`generations/${generationId}.gcode`, "G0 X0 Y0\nG1 X10 Y10");
    artifacts.writeText(`generations/${generationId}.path.txt`, "mock path data");

    db.prepare(`
      UPDATE generations
      SET status = ?, summary_json = ?, gcode_asset_path = ?, path_asset_path = ?
      WHERE id = ?
    `).run(
      "ready",
      JSON.stringify({ lineCount: 2, estimatedDurationSec: 420, boundsMm: { width: 80, height: 50 } }),
      `/storage/generations/${generationId}.gcode`,
      `/storage/generations/${generationId}.path.txt`,
      generationId
    );
  }

  function pushJobEvent(jobId, status) {
    db.prepare("INSERT INTO job_events (id, job_id, status, at) VALUES (?, ?, ?, ?)")
      .run(`${jobId}_${status}_${Date.now()}`, jobId, status, now());
  }

  function updateJob(jobId, status, percent, step) {
    db.prepare(`
      UPDATE jobs
      SET status = ?, progress_json = ?, updated_at = ?
      WHERE id = ?
    `).run(status, JSON.stringify({ percent, currentStep: step }), now(), jobId);
    pushJobEvent(jobId, status);
  }

  async function runJob(jobId) {
    updateJob(jobId, "dispatching", 10, "dispatching");
    await new Promise((resolve) => setTimeout(resolve, 40));
    updateJob(jobId, "running", 65, "streaming");
    await new Promise((resolve) => setTimeout(resolve, 60));
    updateJob(jobId, "completed", 100, "running");
  }

  return {
    completePreview,
    completeGeneration,
    runJob
  };
}

module.exports = {
  createWorkerTasks
};
