function getFixedDelayMs(valueInMinutes) {
  return Math.max(60_000, Number(valueInMinutes || 0) * 60_000);
}

export function createTaskManager(services) {
  let started = false;

  function getTaskRunner() {
    return services.getTaskRunner();
  }

  function publishState() {
    if (typeof services.getPubSub !== 'function') {
      return;
    }

    services.getPubSub().publish('task-manager', {
      tasks: getTaskRunner().getTasksSnapshot(),
    });
  }

  function wrapTask(task) {
    return async () => {
      try {
        await task();
      } finally {
        publishState();
      }
    };
  }

  async function start() {
    if (started) {
      return;
    }

    started = true;
    await services.getUpdateManager().check();

    getTaskRunner().run(
      wrapTask(() => services.getUpdateManager().check()),
      () => getFixedDelayMs(services.getSystemConfig().updateCheck?.intervalMin || 1),
      {name: 'update-check'},
    );

    getTaskRunner().run(
      wrapTask(() => services.getTokenManager().rotateIfNeeded()),
      () => getFixedDelayMs(services.getSystemConfig().entryPath?.rotateMin || 0),
      {name: 'token-rotation'},
    );

    publishState();
  }

  function stop() {
    started = false;
    getTaskRunner().stopAll();
    publishState();
  }

  function getTasksSnapshot() {
    return getTaskRunner().getTasksSnapshot();
  }

  return {
    start,
    stop,
    getTasksSnapshot,
  };
}
