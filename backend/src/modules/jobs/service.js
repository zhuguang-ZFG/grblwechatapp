const crypto = require("crypto");
const { JOB, assertTransition } = require("../../shared/constants/statuses");

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

  function createJob(userId, payload, options = {}) {
    const project = db.prepare("SELECT * FROM projects WHERE id = ? AND owner_user_id = ?").get(payload.projectId, userId);
    const generation = db.prepare("SELECT * FROM generations WHERE id = ? AND project_id = ?").get(payload.generationId, payload.projectId);
    const device = db.prepare("SELECT * FROM devices WHERE id = ? AND (owner_user_id = ? OR owner_user_id = '')").get(payload.deviceId, userId);

    if (!project || !generation || !device) {
      return null;
    }

    const jobId = `job_${crypto.randomUUID().slice(0, 8)}`;
    const traceId = options.traceId || `trace_${crypto.randomUUID()}`;
    const createdAt = now();
    const priority = ["high", "normal", "low"].includes(payload.priority) ? payload.priority : "normal";
    db.prepare(`
      INSERT INTO jobs (id, project_id, generation_id, device_id, trace_id, status, priority, progress_json, failure_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', ?, ?)
    `).run(
      jobId,
      payload.projectId,
      payload.generationId,
      payload.deviceId,
      traceId,
      JOB.QUEUED,
      priority,
      JSON.stringify({ percent: 0, currentStep: JOB.QUEUED }),
      createdAt,
      createdAt
    );

    app.logEvent("job_created", {
      traceId,
      jobId,
      userId,
      projectId: payload.projectId,
      generationId: payload.generationId,
      deviceId: payload.deviceId,
      priority
    }, {
      component: "jobs"
    });

    db.prepare("INSERT INTO job_events (id, job_id, status, at) VALUES (?, ?, ?, ?)")
      .run(`${jobId}_${JOB.QUEUED}`, jobId, JOB.QUEUED, createdAt);

    app.gatewayService.dispatchJob(jobId);

    return {
      jobId,
      status: JOB.QUEUED,
      traceId
    };
  }

  function listJobs(userId, status, failureCategory) {
    const hasStatusFilter = status && status !== "all";
    const hasFailureCategoryFilter = failureCategory && failureCategory !== "all";

    let sql = `
      SELECT jobs.*
      FROM jobs
      INNER JOIN projects ON projects.id = jobs.project_id
      WHERE projects.owner_user_id = ?
    `;
    const params = [userId];

    if (hasStatusFilter) {
      sql += " AND jobs.status = ?";
      params.push(status);
    }

    if (hasFailureCategoryFilter) {
      sql += " AND jobs.failure_json LIKE ?";
      params.push(`%"category":"${failureCategory}"%`);
    }

    sql += " ORDER BY CASE jobs.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 WHEN 'low' THEN 2 ELSE 1 END, jobs.updated_at DESC";
    const rows = db.prepare(sql).all(...params);

    const items = rows.map((row) => ({
        id: row.id,
        projectId: row.project_id,
        deviceId: row.device_id,
        traceId: row.trace_id || "",
        status: row.status,
        priority: row.priority || "normal",
        progress: JSON.parse(row.progress_json),
        failure: parseFailure(row.failure_json),
        updatedAt: row.updated_at
      }));

    const failedByCategory = items.reduce((acc, item) => {
      if (item.status !== JOB.FAILED || !item.failure || !item.failure.category) {
        return acc;
      }
      const key = item.failure.category;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      items,
      page: 1,
      pageSize: rows.length,
      total: rows.length,
      summary: {
        totalFailed: items.filter((item) => item.status === JOB.FAILED).length,
        failedByCategory
      }
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
      traceId: row.trace_id || "",
      status: row.status,
      priority: row.priority || "normal",
      progress: JSON.parse(row.progress_json),
      failure: parseFailure(row.failure_json),
      timeline: events
    };
  }

  function updateJobStatus(jobId, newStatus, progress, userIdForEvent) {
    const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId);
    if (!row) return;
    assertTransition(JOB, row.status, newStatus, "job");
    db.prepare("UPDATE jobs SET status = ?, progress_json = ?, updated_at = ? WHERE id = ?")
      .run(newStatus, JSON.stringify(progress), now(), jobId);
    app.logEvent("job_status_updated", {
      traceId: row.trace_id || "",
      jobId,
      fromStatus: row.status,
      toStatus: newStatus,
      progress
    }, {
      component: "jobs"
    });
    db.prepare("INSERT INTO job_events (id, job_id, status, at) VALUES (?, ?, ?, ?)")
      .run(`${jobId}_${newStatus}_${Date.now()}`, jobId, newStatus, now());
  }

  function cancelJob(userId, jobId) {
    const row = getOwnedJobRow(userId, jobId);
    if (!row) {
      return null;
    }
    try {
      assertTransition(JOB, row.status, JOB.CANCELED, "job");
    } catch {
      return {
        error: {
          code: "invalid_cancel_target",
          message: "Only active jobs can be canceled"
        }
      };
    }

    db.prepare("UPDATE jobs SET status = ?, progress_json = ?, updated_at = ? WHERE id = ?")
      .run(JOB.CANCELED, JSON.stringify({ percent: 0, currentStep: JOB.CANCELED }), now(), jobId);
    db.prepare("INSERT INTO job_events (id, job_id, status, at) VALUES (?, ?, ?, ?)")
      .run(`${jobId}_${JOB.CANCELED}_${Date.now()}`, jobId, JOB.CANCELED, now());

    return getJob(userId, jobId);
  }

  function retryJob(userId, jobId) {
    const row = getOwnedJobRow(userId, jobId);
    if (!row) {
      return null;
    }
    const failure = parseFailure(row.failure_json);
    if (row.status !== JOB.FAILED || !failure || !failure.retryable) {
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
    }, {
      traceId: row.trace_id || undefined
    });
  }

  return {
    createJob,
    listJobs,
    getJob,
    cancelJob,
    retryJob,
    updateJobStatus
  };
}

module.exports = {
  createJobsService
};
