function createWorkerRuntime() {
  const timerIds = new Set();

  function enqueue(task) {
    const timerId = setTimeout(async () => {
      timerIds.delete(timerId);
      try {
        await task();
      } catch (error) {
        console.error(error);
      }
    }, 20);

    timerIds.add(timerId);
  }

  function close() {
    timerIds.forEach((timerId) => clearTimeout(timerId));
    timerIds.clear();
  }

  return {
    enqueue,
    close
  };
}

module.exports = {
  createWorkerRuntime
};
