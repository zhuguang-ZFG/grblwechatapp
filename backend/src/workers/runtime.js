function createWorkerRuntime() {
  function enqueue(task) {
    setTimeout(async () => {
      try {
        await task();
      } catch (error) {
        console.error(error);
      }
    }, 20);
  }

  return {
    enqueue
  };
}

module.exports = {
  createWorkerRuntime
};
