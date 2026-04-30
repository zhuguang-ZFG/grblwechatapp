const crypto = require("crypto");

function now() {
  return new Date().toISOString();
}

function parseFailure(value) {
  return value ? JSON.parse(value) : null;
}

function createJobsService(app) {
  const db = app.db;

  function getOwnedJobRow(userId, jobId) {
    return db.prepare(`
      SELECT jobs.*
      FROM jobs
      INNER JOIN projects ON projects.id = jobs.project_id
      WHERE jobs.id = ? AND projects.owner_user_id = ?
    `).get(jobId, userId);
  }

  function createJob(userId, payload) {
    const project = db.prepare("SELECT * FROM projects WHERE id = ? AND owner_user_id = ?").get(payload.projectId, userId);
    const generation = db.prepare("SELECT * FROM generations WHERE id = ? AND project_id = ?").get(payload.generationId, payload.projectId);
    const device = db.prepare("SELECT * FROM devices WHERE id = ?").get(payload.deviceId);

    if (!project || !generation || !device) {
      return null;
    }

    const jobId = `job_${crypto.randomUUID().slice(0, 8)}`;
    const createdAt = now();
    db.prepare(`
      INSERT INTO jobs (id, project_id, generation_id, device_id, status, progress_json, failure_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'queued', ?, '', ?, ?)
    `).run(jobId, payload.projectId, payload.generationId, payload.deviceId, JSON.stringify({ percent: 0, currentStep: "queued" }), createdAt, createdAt);

    db.prepare("INSERT INTO job_events (id, job_id, status, at) VALUES (?, ?, ?, ?)")
      .run(`${jobId}_queued`, jobId, "queued", createdAt);

    app.workerRuntime.enqueue(async () => {
      await app.workerTasks.runJob(jobId);
    });

    return {
      jobId,
      status: "queued"
    };
  }

  function listJobs(userId, status) {
    const rows = status && status !== "all"
      ? db.prepare(`
          SELECT jobs.*
          FROM jobs
          INNER JOIN projects ON projects.id = jobs.project_id
          WHERE projects.owner_user_id = ? AND jobs.status = ?
          ORDER BY jobs.updated_at DESC
        `).all(userId, status)
      : db.prepare(`
          SELECT jobs.*
          FROM jobs
          INNER JOIN projects ON projects.id = jobs.project_id
          WHERE projects.owner_user_id = ?
          ORDER BY jobs.updated_at DESC
        `).all(userId);

    return {
      items: rows.map((row) => ({
        id: row.id,
        projectId: row.project_id,
        deviceId: row.device_id,
        status: row.status,
        progress: JSON.parse(row.progress_json),
        updatedAt: row.updated_at
      })),
      page: 1,
      pageSize: rows.length,
      total: rows.length
    };
  }

  function getJob(userId, jobId) {
    const row = getOwnedJobRow(userId, jobId);
    if (!row) {
      return null;
    }

    const events = db.prepare("SELECT status, at FROM job_events WHERE job_id = ? ORDER BY at ASC").all(jobId);
    return {
      id: row.id,
      projectId: row.project_id,
      generationId: row.generation_id,
      deviceId: row.device_id,
      status: row.status,
      progress: JSON.parse(row.progress_json),
      failure: parseFailure(row.failure_json),
      timeline: events
    };
  }

  function cancelJob(userId, jobId) {
    const row = getOwnedJobRow(userId, jobId);
    if (!row) {
      return null;
    }
    if (!["queued", "dispatching", "running"].includes(row.status)) {
      return {
        error: {
          code: "invalid_cancel_target",
          message: "Only active jobs can be canceled"
        }
      };
    }

    db.prepare("UPDATE jobs SET status = ?, progress_json = ?, updated_at = ? WHERE id = ?")
      .run("canceled", JSON.stringify({ percent: 0, currentStep: "canceled" }), now(), jobId);
    db.prepare("INSERT INTO job_events (id, job_id, status, at) VALUES (?, ?, ?, ?)")
      .run(`${jobId}_canceled_${Date.now()}`, jobId, "canceled", now());

    return getJob(userId, jobId);
  }

  function retryJob(userId, jobId) {
    const row = getOwnedJobRow(userId, jobId);
    if (!row) {
      return null;
    }
    const failure = parseFailure(row.failure_json);
    if (row.status !== "failed" || !failure || !failure.retryable) {
      return {
        error: {
          code: "invalid_retry_target",
          message: "Only retryable failed jobs can be retried"
        }
      };
    }

    return createJob(userId, {
      projectId: row.project_id,
      generationId: row.generation_id,
      deviceId: row.device_id
    });
  }

  return {
    createJob,
    listJobs,
    getJob,
    cancelJob,
    retryJob
  };
}

module.exports = {
  createJobsService
};
