function createWorkerRuntime() {
  // Priority queue: jobs ordered by priority (high=0, normal=1, low=2)
  const queue = [];
  const activeJobs = new Set();
  let processing = false;

  function priorityOrder(priority) {
    if (priority === "high") return 0;
    if (priority === "low") return 2;
    return 1;
  }

  function enqueue(task, priority) {
    const entry = { task, priority: priorityOrder(priority || "normal"), id: Date.now() };
    // Insert in priority order, then FIFO within same priority
    const idx = queue.findIndex((e) => e.priority > entry.priority || (e.priority === entry.priority && e.id > entry.id));
    if (idx === -1) {
      queue.push(entry);
    } else {
      queue.splice(idx, 0, entry);
    }
    if (!processing) {
      processNext();
    }
  }

  function processNext() {
    if (queue.length === 0) {
      processing = false;
      return;
    }
    processing = true;
    const entry = queue.shift();
    const timerId = setTimeout(async () => {
      activeJobs.delete(timerId);
      try {
        await entry.task();
      } catch (error) {
        console.error(error);
      }
      processNext();
    }, 20);
    activeJobs.add(timerId);
  }

  function close() {
    activeJobs.forEach((timerId) => clearTimeout(timerId));
    activeJobs.clear();
    queue.length = 0;
    processing = false;
  }

  return {
    enqueue,
    close
  };
}

module.exports = {
  createWorkerRuntime
};
