const { resolveFailure } = require("../modules/jobs/failure-codes");

function now() {
  return new Date().toISOString();
}

function generateBasicSvg(project, content, layout) {
  const w = layout.widthMm || 80;
  const h = layout.heightMm || 50;
  const lines = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">`];

  // Work area background
  lines.push(`<rect width="${w}" height="${h}" fill="#fafafa" stroke="#ccc" stroke-width="0.5"/>`);

  // Grid lines every 10mm
  for (let x = 10; x < w; x += 10) {
    lines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="#eee" stroke-width="0.2"/>`);
  }
  for (let y = 10; y < h; y += 10) {
    lines.push(`<line x1="0" y1="${y}" x2="${w}" y2="${h}" stroke="#eee" stroke-width="0.2"/>`);
  }

  if (project.source_type === "text" && content.text) {
    const textLines = content.text.split("\n");
    const fontSize = Math.max(Math.min(w / textLines.reduce((max, l) => Math.max(max, l.length), 1) * 1.8, h / (textLines.length + 1) * 0.8), 2);
    const lineHeight = fontSize * 1.4;
    const totalTextH = textLines.length * lineHeight;
    const startY = (h - totalTextH) / 2 + fontSize;
    let textAnchor, textX;

    if (layout.align === "left") {
      textAnchor = "start";
      textX = 4;
    } else if (layout.align === "right") {
      textAnchor = "end";
      textX = w - 4;
    } else {
      textAnchor = "middle";
      textX = w / 2;
    }

    const rotation = layout.rotationDeg ? ` transform="rotate(${layout.rotationDeg} ${w / 2} ${h / 2})"` : "";
    textLines.forEach((line, i) => {
      const escaped = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      lines.push(`<text x="${textX}" y="${(startY + i * lineHeight).toFixed(1)}" text-anchor="${textAnchor}" font-size="${fontSize.toFixed(1)}" font-family="sans-serif" fill="#333"${rotation}>${escaped}</text>`);
    });
  } else if (project.source_type === "image") {
    // Image placeholder representation
    const margin = w * 0.1;
    const imgW = w - margin * 2;
    const imgH = h - margin * 2;
    lines.push(`<rect x="${margin}" y="${margin}" width="${imgW}" height="${imgH}" fill="#e0e0e0" stroke="#999" stroke-width="0.5" rx="2"/>`);
    lines.push(`<line x1="${margin + imgW * 0.3}" y1="${margin + imgH * 0.3}" x2="${margin + imgW * 0.7}" y2="${margin + imgH * 0.7}" stroke="#bbb" stroke-width="0.5"/>`);
    lines.push(`<line x1="${margin + imgW * 0.7}" y1="${margin + imgH * 0.3}" x2="${margin + imgW * 0.3}" y2="${margin + imgH * 0.7}" stroke="#bbb" stroke-width="0.5"/>`);
    lines.push(`<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(imgW, imgH) * 0.15}" fill="none" stroke="#bbb" stroke-width="0.5"/>`);
  }

  lines.push("</svg>");
  return lines.join("\n");
}

function generateBasicGCode(project, content, layout, processParams) {
  const gcode = [];
  gcode.push("G21 ; Set units to mm");
  gcode.push("G90 ; Absolute positioning");
  gcode.push(`F${processParams.speed || 1000}`);
  gcode.push("G0 Z5 ; Raise to safe height");

  const w = layout.widthMm || 80;
  const h = layout.heightMm || 50;
  const passes = processParams.passes || 1;
  const lineSpacing = processParams.lineSpacing || 1.0;
  const margin = 2;
  const engraveW = w - margin * 2;
  const engraveH = h - margin * 2;

  // Outline bounding box
  gcode.push("; ---- Outline ----");
  gcode.push("G0 X0 Y0");
  gcode.push("G1 Z0");
  gcode.push(`G1 X${w.toFixed(1)} Y0`);
  gcode.push(`G1 X${w.toFixed(1)} Y${h.toFixed(1)}`);
  gcode.push(`G1 X0 Y${h.toFixed(1)}`);
  gcode.push("G1 X0 Y0");
  gcode.push("G0 Z5");

  if (project.source_type === "text" && content.text) {
    gcode.push("; ---- Text engraving raster fill ----");
    const textLines = content.text.split("\n");
    const lineCount = textLines.length;
    const lineH = engraveH / (lineCount + 1);
    for (let p = 0; p < passes; p++) {
      for (let li = 0; li < lineCount; li++) {
        const line = textLines[li];
        if (!line.trim()) continue;
        const yCenter = margin + lineH * (li + 1);
        const charWidth = engraveW / Math.max(line.length, 1) * 0.6;
        const rasterH = lineH * 0.5;
        let y = yCenter - rasterH / 2;
        let dir = 1;

        // Raster fill each line's bounding box
        while (y < yCenter + rasterH / 2) {
          const x1 = margin + engraveW * 0.1;
          const x2 = margin + engraveW * 0.9;
          gcode.push(`G0 X${x1.toFixed(1)} Y${y.toFixed(1)}`);
          gcode.push("G1 Z0");
          gcode.push(`G1 X${x2.toFixed(1)} Y${y.toFixed(1)}`);
          gcode.push("G0 Z5");
          y += lineSpacing;
        }
      }
    }
  } else if (project.source_type === "image") {
    gcode.push("; ---- Image engraving raster fill ----");
    // Raster fill the entire work area with back-and-forth passes
    for (let p = 0; p < passes; p++) {
      let y = margin;
      let row = 0;
      while (y < margin + engraveH) {
        if (row % 2 === 0) {
          gcode.push(`G0 X${margin.toFixed(1)} Y${y.toFixed(1)}`);
          gcode.push("G1 Z0");
          gcode.push(`G1 X${(margin + engraveW).toFixed(1)} Y${y.toFixed(1)}`);
        } else {
          gcode.push(`G0 X${(margin + engraveW).toFixed(1)} Y${y.toFixed(1)}`);
          gcode.push("G1 Z0");
          gcode.push(`G1 X${margin.toFixed(1)} Y${y.toFixed(1)}`);
        }
        gcode.push("G0 Z5");
        y += lineSpacing;
        row++;
      }
    }
  }

  gcode.push("G0 X0 Y0");
  gcode.push("G0 Z5");
  return gcode.join("\n");
}

function createWorkerTasks(app) {
  const db = app.db;
  const artifacts = app.artifacts;

  function completePreview(previewId) {
    const preview = db.prepare("SELECT * FROM previews WHERE id = ?").get(previewId);
    if (!preview) return;

    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(preview.project_id);
    if (!project) return;

    const content = JSON.parse(project.content_json);
    const layout = JSON.parse(project.layout_json);
    const processParams = JSON.parse(project.process_params_json);
    const widthMm = layout.widthMm || 80;
    const heightMm = layout.heightMm || 50;

    let pathCount;
    if (project.source_type === "text" && content.text) {
      const charCount = content.text.replace(/\s/g, "").length;
      pathCount = Math.max(10, charCount * 25 + Math.round(widthMm * heightMm * 0.01));
    } else if (project.source_type === "image") {
      pathCount = Math.max(50, Math.round(widthMm * heightMm * 0.03));
    } else {
      pathCount = 126;
    }

    const speed = processParams.speed || 1000;
    const passes = processParams.passes || 1;
    const estimatedDurationSec = Math.max(30, Math.round((pathCount / speed) * 60 * passes));

    const svgContent = generateBasicSvg(project, content, layout);
    artifacts.writeText(`previews/${previewId}.svg`, svgContent);
    artifacts.writeText(`previews/${previewId}.txt`,
      `Preview ready: ${pathCount} paths, ~${estimatedDurationSec}s estimated`);

    db.prepare(`
      UPDATE previews
      SET status = ?, preview_image_url = ?, preview_svg_url = ?, metrics_json = ?, warnings_json = ?
      WHERE id = ?
    `).run(
      "ready",
      `/storage/previews/${previewId}.txt`,
      `/storage/previews/${previewId}.svg`,
      JSON.stringify({ widthMm, heightMm, pathCount, estimatedDurationSec }),
      JSON.stringify([]),
      previewId
    );

    // Cleanup: keep only last 20 preview artifacts
    artifacts.cleanByCount("previews", 20);
  }

  function completeGeneration(generationId) {
    const gen = db.prepare("SELECT * FROM generations WHERE id = ?").get(generationId);
    if (!gen) return;

    const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(gen.project_id);
    if (!project) return;

    const content = JSON.parse(project.content_json);
    const layout = JSON.parse(project.layout_json);
    const processParams = JSON.parse(project.process_params_json);

    const gcode = generateBasicGCode(project, content, layout, processParams);
    artifacts.writeText(`generations/${generationId}.gcode`, gcode);
    artifacts.writeText(`generations/${generationId}.path.txt`, `Path data for ${gen.project_id}`);

    const lineCount = gcode.split("\n").length;
    const speed = processParams.speed || 1000;
    const passes = processParams.passes || 1;
    const estimatedDurationSec = Math.max(30, Math.round((lineCount / speed) * 60 * passes));

    db.prepare(`
      UPDATE generations
      SET status = ?, summary_json = ?, gcode_asset_path = ?, path_asset_path = ?
      WHERE id = ?
    `).run(
      "ready",
      JSON.stringify({ lineCount, estimatedDurationSec, boundsMm: { width: layout.widthMm || 80, height: layout.heightMm || 50 } }),
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
      SET status = ?, progress_json = ?, failure_json = ?, updated_at = ?
      WHERE id = ?
    `).run(status, JSON.stringify({ percent, currentStep: step }), "", now(), jobId);
    pushJobEvent(jobId, status);
  }

  function failJob(jobId, step, failure) {
    db.prepare(`
      UPDATE jobs
      SET status = ?, progress_json = ?, failure_json = ?, updated_at = ?
      WHERE id = ?
    `).run("failed", JSON.stringify({ percent: 100, currentStep: step }), JSON.stringify(failure), now(), jobId);
    pushJobEvent(jobId, "failed");
  }

  function getSimulatedFailureCode(jobId) {
    const row = db.prepare(`
      SELECT projects.process_params_json AS process_params_json
      FROM jobs
      INNER JOIN projects ON projects.id = jobs.project_id
      WHERE jobs.id = ?
    `).get(jobId);
    if (!row) return "";
    const processParams = JSON.parse(row.process_params_json || "{}");
    return processParams.simulateFailureCode || "";
  }

  async function runJob(jobId) {
    const job = db.prepare(`
      SELECT jobs.*, projects.process_params_json AS pp_json
      FROM jobs
      INNER JOIN projects ON projects.id = jobs.project_id
      WHERE jobs.id = ?
    `).get(jobId);
    if (!job) return;

    const processParams = JSON.parse(job.pp_json || "{}");
    const speed = processParams.speed || 1000;
    const passes = processParams.passes || 1;

    updateJob(jobId, "dispatching", 10, "dispatching");
    await new Promise((resolve) => setTimeout(resolve, 40));

    const simulatedFailure = resolveFailure(getSimulatedFailureCode(jobId));
    if (simulatedFailure) {
      failJob(jobId, "dispatching", simulatedFailure);
      return;
    }

    updateJob(jobId, "running", 65, "streaming");
    const runDelay = Math.max(40, Math.min(200, Math.round((passes * 60000) / speed)));
    await new Promise((resolve) => setTimeout(resolve, runDelay));

    updateJob(jobId, "completed", 100, "completed");
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
