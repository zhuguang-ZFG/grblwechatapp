const crypto = require("crypto");
const path = require("path");
const { PROJECT, assertTransition } = require("../../shared/constants/statuses");

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
    machineProfileId: row.machine_profile_id || "",
    materialProfileId: row.material_profile_id || "",
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
        machine_profile_id, material_profile_id,
        content_json, layout_json, process_params_json, latest_preview_id,
        latest_generation_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, ?)
    `).run(
      id,
      userId,
      payload.name,
      payload.sourceType,
      PROJECT.DRAFT,
      payload.selectedDeviceId || "",
      payload.machineProfileId || "",
      payload.materialProfileId || "",
      JSON.stringify(payload.content || { text: "", imageAssetId: null, fontId: "fnt_001", fontSize: 100, lineGap: 0, charSpacing: 0, strokeWidth: 0, processorPresetId: null, cropBounds: null, offsetXMm: 0, offsetYMm: 0, scaleFactor: 1, contentRotation: 0 }),
      JSON.stringify(payload.layout || { widthMm: 80, heightMm: 50, rotationDeg: 0, align: "center", blockWidth: 0 }),
      JSON.stringify(payload.processParams || { speed: 1000, power: 65, passes: 1, lineSpacing: 1.2 }),
      createdAt,
      createdAt
    );

    return {
      id,
      status: PROJECT.DRAFT
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
      selectedDeviceId: payload.selectedDeviceId !== undefined ? payload.selectedDeviceId : existing.selectedDeviceId,
      machineProfileId: payload.machineProfileId !== undefined ? payload.machineProfileId : existing.machineProfileId,
      materialProfileId: payload.materialProfileId !== undefined ? payload.materialProfileId : existing.materialProfileId,
      content: payload.content || existing.content,
      layout: payload.layout || existing.layout,
      processParams: payload.processParams || existing.processParams
    };

    db.prepare(`
      UPDATE projects
      SET name = ?, source_type = ?, selected_device_id = ?, machine_profile_id = ?, material_profile_id = ?,
          content_json = ?, layout_json = ?, process_params_json = ?, updated_at = ?
      WHERE id = ? AND owner_user_id = ?
    `).run(
      next.name,
      next.sourceType,
      next.selectedDeviceId,
      next.machineProfileId,
      next.materialProfileId,
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
      machineProfileId: existing.machineProfileId,
      materialProfileId: existing.materialProfileId,
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
    assertTransition(PROJECT, existing.status, PROJECT.ARCHIVED, "project");
    db.prepare(`
      UPDATE projects
      SET status = ?, updated_at = ?
      WHERE id = ? AND owner_user_id = ?
    `).run(PROJECT.ARCHIVED, now(), projectId, userId);
    return getProject(userId, projectId);
  }

  function restoreProject(userId, projectId) {
    const existing = getProject(userId, projectId);
    if (!existing) {
      return null;
    }
    assertTransition(PROJECT, existing.status, PROJECT.DRAFT, "project");
    db.prepare(`
      UPDATE projects
      SET status = ?, updated_at = ?
      WHERE id = ? AND owner_user_id = ?
    `).run(PROJECT.DRAFT, now(), projectId, userId);
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

  function exportProject(userId, projectId) {
    const project = getProject(userId, projectId);
    if (!project) {
      return null;
    }
    return {
      formatVersion: "1.0",
      exportedAt: now(),
      project: {
        name: project.name,
        sourceType: project.sourceType,
        selectedDeviceId: project.selectedDeviceId,
        machineProfileId: project.machineProfileId,
        materialProfileId: project.materialProfileId,
        content: project.content,
        layout: project.layout,
        processParams: project.processParams
      }
    };
  }

  function importProject(userId, payload) {
    if (!payload || payload.formatVersion !== "1.0" || !payload.project) {
      return null;
    }
    const data = payload.project;
    return createProject(userId, {
      name: data.name || "Imported Project",
      sourceType: data.sourceType || "text",
      selectedDeviceId: data.selectedDeviceId || "",
      machineProfileId: data.machineProfileId || "",
      materialProfileId: data.materialProfileId || "",
      content: data.content,
      layout: data.layout,
      processParams: data.processParams
    });
  }

  function preflightCheck(userId, projectId) {
    const project = getProject(userId, projectId);
    if (!project) {
      return { valid: false, errors: [{ field: "project", message: "项目不存在" }] };
    }

    const errors = [];
    const warnings = [];

    // Check content exists
    if (project.sourceType === "text" && !project.content.text) {
      errors.push({ field: "content.text", message: "文字项目内容不能为空" });
    }
    if (project.sourceType === "image" && !project.content.imageAssetId) {
      errors.push({ field: "content.imageAssetId", message: "图片项目未选择素材" });
    }

    // Check device
    if (!project.selectedDeviceId) {
      errors.push({ field: "selectedDeviceId", message: "未选择设备" });
    } else {
      const device = app.db.prepare("SELECT * FROM devices WHERE id = ?").get(project.selectedDeviceId);
      if (!device) {
        errors.push({ field: "selectedDeviceId", message: "所选设备不存在" });
      }
    }

    // Check machine profile dimensions
    if (project.machineProfileId) {
      const profile = app.db.prepare("SELECT * FROM machine_profiles WHERE id = ?").get(project.machineProfileId);
      if (profile) {
        const workArea = JSON.parse(profile.work_area_json || "{}");
        if (workArea.widthMm && project.layout.widthMm > workArea.widthMm) {
          errors.push({ field: "layout.widthMm", message: `项目宽度(${project.layout.widthMm}mm)超过机器加工范围(${workArea.widthMm}mm)` });
        }
        if (workArea.heightMm && project.layout.heightMm > workArea.heightMm) {
          errors.push({ field: "layout.heightMm", message: `项目高度(${project.layout.heightMm}mm)超过机器加工范围(${workArea.heightMm}mm)` });
        }
      } else {
        warnings.push({ field: "machineProfileId", message: "所选机器配置不存在，跳过尺寸检查" });
      }
    }

    // Check process params
    if (project.processParams.speed <= 0) {
      errors.push({ field: "processParams.speed", message: "速度必须大于 0" });
    }
    if (project.processParams.power < 1 || project.processParams.power > 100) {
      errors.push({ field: "processParams.power", message: "功率应在 1-100 之间" });
    }
    if ((project.processParams.passes || 1) < 1) {
      errors.push({ field: "processParams.passes", message: "加工次数不能小于 1" });
    }
    if ((project.processParams.lineSpacing || 1) < 0.1) {
      warnings.push({ field: "processParams.lineSpacing", message: "行距过小可能造成过度雕刻" });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  function createAsset(userId, projectId, payload) {
    const project = getProject(userId, projectId);
    if (!project) {
      return null;
    }
    const assetId = `ast_${crypto.randomUUID().slice(0, 8)}`;
    const ext = path.extname(payload.fileName || "image.png").toLowerCase() || ".png";
    const relativePath = `assets/${assetId}${ext}`;

    if (payload.data) {
      const buffer = Buffer.from(payload.data, "base64");
      app.artifacts.writeBinary(relativePath, buffer);
    }

    return {
      assetId,
      assetUrl: `/storage/${relativePath}`
    };
  }

  return {
    createProject,
    listProjects,
    getProject,
    updateProject,
    duplicateProject,
    archiveProject,
    restoreProject,
    deleteProject,
    exportProject,
    importProject,
    preflightCheck,
    createAsset
  };
}

module.exports = {
  createProjectsService
};
