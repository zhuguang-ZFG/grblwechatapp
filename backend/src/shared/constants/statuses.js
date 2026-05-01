// Centralized state machine definitions for all entities
// Each entity defines valid states and their allowed transitions.

const JOB = {
  QUEUED: "queued",
  DISPATCHING: "dispatching",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELED: "canceled",

  _transitions: {
    queued: ["dispatching", "canceled"],
    dispatching: ["running", "failed", "canceled"],
    running: ["completed", "failed", "canceled"],
    completed: [],
    failed: [],
    canceled: []
  }
};

const PREVIEW = {
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed",

  _transitions: {
    processing: ["ready", "failed"],
    ready: [],
    failed: []
  }
};

const GENERATION = {
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed",

  _transitions: {
    processing: ["ready", "failed"],
    ready: [],
    failed: []
  }
};

const PROJECT = {
  DRAFT: "draft",
  ARCHIVED: "archived",

  _transitions: {
    draft: ["archived"],
    archived: ["draft"]
  }
};

function canTransition(def, from, to) {
  if (!def._transitions) return false;
  const allowed = def._transitions[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

function assertTransition(def, from, to, label) {
  if (from === to) return; // Same-status progress update is always allowed
  if (!canTransition(def, from, to)) {
    const name = label || "entity";
    throw new Error(`Invalid ${name} state transition: "${from}" -> "${to}"`);
  }
}

module.exports = {
  JOB,
  PREVIEW,
  GENERATION,
  PROJECT,
  canTransition,
  assertTransition
};
