const { resolveFailure } = require("../modules/jobs/failure-codes");
const { JOB, PREVIEW, GENERATION, assertTransition } = require("../shared/constants/statuses");

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

  // Content group with position, scale, rotation transforms
  const offX = content.offsetXMm || 0;
  const offY = content.offsetYMm || 0;
  const sF = content.scaleFactor || 1;
  const cRot = content.contentRotation || 0;
  const lRot = layout.rotationDeg || 0;
  let groupTransform = "";
  if (lRot || offX || offY || sF !== 1 || cRot) {
    const transforms = [];
    if (lRot) transforms.push(`rotate(${lRot} ${w / 2} ${h / 2})`);
    if (offX || offY || sF !== 1 || cRot) {
      const cx = w / 2;
      const cy = h / 2;
      let inner = "";
      inner += `translate(${offX},${offY})`;
      if (cRot) inner += ` rotate(${cRot} ${cx} ${cy})`;
      if (sF !== 1) inner += ` scale(${sF}) translate(${cx * (1 - 1 / sF)},${cy * (1 - 1 / sF)})`;
      transforms.push(inner);
    }
    groupTransform = ` transform="${transforms.join(" ")}"`;
  }

  lines.push(`<g${groupTransform}>`);

  if (project.source_type === "text" && content.text) {
    const textLines = content.text.split("\n");
    const blockWidth = layout.blockWidth || 0;

    // Wrap lines if blockWidth set
    const wrappedLines = [];
    textLines.forEach((rawLine) => {
      if (blockWidth <= 0 || rawLine.length <= 1) {
        wrappedLines.push(rawLine);
        return;
      }
      // Approximate char width: font-size * 0.6
      const approxCharW = 4;
      const maxChars = Math.max(1, Math.floor(blockWidth / approxCharW));
      for (let i = 0; i < rawLine.length; i += maxChars) {
        wrappedLines.push(rawLine.substring(i, i + maxChars));
      }
    });

    const fontSize = Math.max(Math.min(w / wrappedLines.reduce((max, l) => Math.max(max, l.length || 1), 1) * 1.8, h / (wrappedLines.length + 1) * 0.8), 2);
    const lineHeight = fontSize * 1.4;
    const totalTextH = wrappedLines.length * lineHeight;
    let offsetY = (h - totalTextH) / 2 + fontSize;
    const charSpacing = content.charSpacing || 0;
    const strokeW = content.strokeWidth || 0;

    let textAnchor, baseX;
    if (layout.align === "left") {
      textAnchor = "start";
      baseX = 4;
    } else if (layout.align === "right") {
      textAnchor = "end";
      baseX = w - 4;
    } else {
      textAnchor = "middle";
      baseX = w / 2;
    }

    wrappedLines.forEach((line) => {
      const escaped = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      if (strokeW > 0) {
        // Engraving-style stroke text
        lines.push(`<text x="${baseX}" y="${offsetY.toFixed(1)}" text-anchor="${textAnchor}" font-size="${fontSize.toFixed(1)}" font-family="sans-serif" fill="none" stroke="#333" stroke-width="${Math.max(strokeW * 0.5, 0.1)}" letter-spacing="${charSpacing}">${escaped}</text>`);
      }
      lines.push(`<text x="${baseX}" y="${offsetY.toFixed(1)}" text-anchor="${textAnchor}" font-size="${fontSize.toFixed(1)}" font-family="sans-serif" fill="#333" letter-spacing="${charSpacing}">${escaped}</text>`);
      offsetY += lineHeight;
    });
  } else if (project.source_type === "image") {
    // Raster fill simulation using back-and-forth lines
    const margin = w * 0.1;
    const imgW = w - margin * 2;
    const imgH = h - margin * 2;
    const lineSpacing = project.process_params_json ? (JSON.parse(project.process_params_json).lineSpacing || 1.0) : 1.0;
    const step = Math.max(lineSpacing * 2, 1);

    lines.push(`<rect x="${margin}" y="${margin}" width="${imgW}" height="${imgH}" fill="#f0f0f0" stroke="#999" stroke-width="0.5" rx="2"/>`);

    // Draw raster lines
    for (let y = margin; y <= margin + imgH; y += step) {
      const x1 = margin;
      const x2 = margin + imgW;
      const row = Math.round((y - margin) / step);
      if (row % 2 === 0) {
        lines.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#666" stroke-width="0.3"/>`);
      } else {
        lines.push(`<line x1="${x2}" y1="${y}" x2="${x1}" y2="${y}" stroke="#666" stroke-width="0.3"/>`);
      }
    }

    // Center icon
    const r = Math.min(imgW, imgH) * 0.15;
    lines.push(`<circle cx="${w / 2}" cy="${h / 2}" r="${r}" fill="none" stroke="#999" stroke-width="0.5"/>`);
    lines.push(`<line x1="${w / 2 - r * 0.6}" y1="${h / 2 - r * 0.6}" x2="${w / 2 + r * 0.6}" y2="${h / 2 + r * 0.6}" stroke="#999" stroke-width="0.5"/>`);
  }

  lines.push("</g>");
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

  // Content offset in mm
  const offX = content.offsetXMm || 0;
  const offY = content.offsetYMm || 0;
  const sF = content.scaleFactor || 1;
  const cRot = content.contentRotation || 0;

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

    // Apply rotation + offset to the engraving center
    const centerX = w / 2 + offX;
    const centerY = h / 2 + offY;

    const charSpacing = content.charSpacing || 0;

    for (let p = 0; p < passes; p++) {
      for (let li = 0; li < lineCount; li++) {
        const line = textLines[li];
        if (!line.trim()) continue;
        const yCenter = margin + lineH * (li + 1);
        const scaledY = centerY + (yCenter - h / 2) * sF;
        const lineW = engraveW * sF;
        const rasterH = lineH * 0.5 * sF;
        let y = scaledY - rasterH / 2;
        const xCenter = centerX;

        // Raster fill each line's bounding box
        while (y < scaledY + rasterH / 2) {
          const halfW = lineW * 0.4;
          const x1 = xCenter - halfW;
          const x2 = xCenter + halfW;
          const row = Math.round((y - (scaledY - rasterH / 2)) / lineSpacing);
          if (cRot) {
            const rad = cRot * Math.PI / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const rx1 = centerX + (x1 - centerX) * cos - (y - centerY) * sin;
            const ry1 = centerY + (x1 - centerX) * sin + (y - centerY) * cos;
            const rx2 = centerX + (x2 - centerX) * cos - (y - centerY) * sin;
            const ry2 = centerY + (x2 - centerX) * sin + (y - centerY) * cos;
            gcode.push(`G0 X${rx1.toFixed(2)} Y${ry1.toFixed(2)}`);
            gcode.push("G1 Z0");
            gcode.push(`G1 X${rx2.toFixed(2)} Y${ry2.toFixed(2)}`);
          } else {
            if (row % 2 === 0) {
              gcode.push(`G0 X${x1.toFixed(2)} Y${y.toFixed(2)}`);
              gcode.push("G1 Z0");
              gcode.push(`G1 X${x2.toFixed(2)} Y${y.toFixed(2)}`);
            } else {
              gcode.push(`G0 X${x2.toFixed(2)} Y${y.toFixed(2)}`);
              gcode.push("G1 Z0");
              gcode.push(`G1 X${x1.toFixed(2)} Y${y.toFixed(2)}`);
            }
          }
          gcode.push("G0 Z5");
          y += lineSpacing;
        }
      }
    }
  } else if (project.source_type === "image") {
    gcode.push("; ---- Image engraving raster fill ----");
    const centerX = w / 2 + offX;
    const centerY = h / 2 + offY;
    const scaledW = engraveW * sF;
    const scaledH = engraveH * sF;

    for (let p = 0; p < passes; p++) {
      let y = -scaledH / 2;
      let row = 0;
      while (y < scaledH / 2) {
        const x1 = -scaledW / 2;
        const x2 = scaledW / 2;
        let gx1, gy1, gx2, gy2;

        if (cRot) {
          const rad = cRot * Math.PI / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          gx1 = centerX + x1 * cos - y * sin;
          gy1 = centerY + x1 * sin + y * cos;
          gx2 = centerX + x2 * cos - y * sin;
          gy2 = centerY + x2 * sin + y * cos;
        } else {
          gx1 = centerX + x1;
          gy1 = centerY + y;
          gx2 = centerX + x2;
          gy2 = centerY + y;
        }

        if (row % 2 === 0) {
          gcode.push(`G0 X${gx1.toFixed(2)} Y${gy1.toFixed(2)}`);
          gcode.push("G1 Z0");
          gcode.push(`G1 X${gx2.toFixed(2)} Y${gy2.toFixed(2)}`);
        } else {
          gcode.push(`G0 X${gx2.toFixed(2)} Y${gy2.toFixed(2)}`);
          gcode.push("G1 Z0");
          gcode.push(`G1 X${gx1.toFixed(2)} Y${gy1.toFixed(2)}`);
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
      const hasStroke = (content.strokeWidth || 0) > 0 ? 1.5 : 1;
      pathCount = Math.max(10, Math.round(charCount * 25 * hasStroke * (content.scaleFactor || 1)));
    } else if (project.source_type === "image") {
      const sF = content.scaleFactor || 1;
      pathCount = Math.max(50, Math.round(widthMm * heightMm * 0.03 * sF));
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
      PREVIEW.READY,
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
      GENERATION.READY,
      JSON.stringify({ lineCount, estimatedDurationSec, boundsMm: { width: layout.widthMm || 80, height: layout.heightMm || 50 } }),
      `/storage/generations/${generationId}.gcode`,
      `/storage/generations/${generationId}.path.txt`,
      generationId
    );

    // Cleanup: keep only last 20 generation artifacts
    artifacts.cleanByCount("generations", 20);
  }

  function pushJobEvent(jobId, status) {
    db.prepare("INSERT INTO job_events (id, job_id, status, at) VALUES (?, ?, ?, ?)")
      .run(`${jobId}_${status}_${Date.now()}`, jobId, status, now());
  }

  function updateJob(jobId, status, percent, step) {
    const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId);
    if (row) {
      assertTransition(JOB, row.status, status, "job");
    }
    db.prepare(`
      UPDATE jobs
      SET status = ?, progress_json = ?, failure_json = ?, updated_at = ?
      WHERE id = ?
    `).run(status, JSON.stringify({ percent, currentStep: step }), "", now(), jobId);
    pushJobEvent(jobId, status);
  }

  function failJob(jobId, step, failure) {
    const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(jobId);
    if (row) {
      assertTransition(JOB, row.status, JOB.FAILED, "job");
    }
    db.prepare(`
      UPDATE jobs
      SET status = ?, progress_json = ?, failure_json = ?, updated_at = ?
      WHERE id = ?
    `).run(JOB.FAILED, JSON.stringify({ percent: 100, currentStep: step }), JSON.stringify(failure), now(), jobId);
    pushJobEvent(jobId, JOB.FAILED);
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

    updateJob(jobId, JOB.DISPATCHING, 10, "dispatching");
    await new Promise((resolve) => setTimeout(resolve, 40));

    const simulatedFailure = resolveFailure(getSimulatedFailureCode(jobId));
    if (simulatedFailure) {
      failJob(jobId, "dispatching", simulatedFailure);
      return;
    }

    updateJob(jobId, JOB.RUNNING, 65, "streaming");
    const runDelay = Math.max(40, Math.min(200, Math.round((passes * 60000) / speed)));
    await new Promise((resolve) => setTimeout(resolve, runDelay));

    updateJob(jobId, JOB.COMPLETED, 100, "completed");
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
