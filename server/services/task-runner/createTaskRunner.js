export function createTaskRunner() {
  const stops = new Set();
  const tasks = new Set();
  let nextTaskId = 1;

  function normalizeDelay(delay) {
    const value = Number(delay);
    if (!Number.isFinite(value)) {
      return null;
    }

    return Math.max(0, Math.floor(value));
  }

  function run(task, delayOrProvider, options = {}) {
    let timer = null;
    let stopped = false;
    const taskState = {
      id: `task-${nextTaskId++}`,
      name: typeof options.name === 'string' && options.name.trim() ? options.name.trim() : 'unnamed-task',
      dueAt: null,
      delayMs: null,
      running: false,
    };

    tasks.add(taskState);

    function getDelayMs() {
      const rawDelay = typeof delayOrProvider === 'function'
        ? delayOrProvider()
        : delayOrProvider;
      return normalizeDelay(rawDelay);
    }

    async function loop() {
      if (stopped) {
        return;
      }

      taskState.running = true;
      taskState.dueAt = null;

      try {
        await task();
      } finally {
        taskState.running = false;
        schedule();
      }
    }

    function schedule() {
      if (stopped) {
        return;
      }

      const delayMs = getDelayMs();
      taskState.delayMs = delayMs;

      if (delayMs === null) {
        taskState.dueAt = null;
        return;
      }

      taskState.dueAt = new Date(Date.now() + delayMs).toISOString();
      timer = setTimeout(() => {
        timer = null;
        void loop();
      }, delayMs);
    }

    function stop() {
      if (stopped) {
        return;
      }

      stopped = true;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      taskState.dueAt = null;
      taskState.running = false;
      tasks.delete(taskState);
      stops.delete(stop);
    }

    stops.add(stop);
    schedule();

    return stop;
  }

  function stopAll() {
    for (const stop of Array.from(stops)) {
      stop();
    }
  }

  function getTasksSnapshot() {
    return Array.from(tasks, (task) => ({
      id: task.id,
      name: task.name,
      dueAt: task.dueAt,
      delayMs: task.delayMs,
      running: task.running,
    }));
  }

  return {
    run,
    stopAll,
    getTasksSnapshot,
  };
}
