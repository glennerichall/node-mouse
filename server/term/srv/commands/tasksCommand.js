function mapTask(task) {
  const dueAt = task?.dueAt || null;
  const dueInMs = dueAt ? new Date(dueAt).getTime() - Date.now() : null;

  return {
    id: task?.id || null,
    name: task?.name || 'unnamed-task',
    running: Boolean(task?.running),
    delayMs: Number.isFinite(task?.delayMs) ? task.delayMs : null,
    dueAt,
    dueInMs: Number.isFinite(dueInMs) ? dueInMs : null,
  };
}

export async function executeTasksCommand(services) {
  return {
    ok: true,
    message: 'Etat du task manager.',
    data: {
      now: new Date().toISOString(),
      tasks: services.getTaskManager().getTasksSnapshot().map(mapTask),
    },
  };
}
