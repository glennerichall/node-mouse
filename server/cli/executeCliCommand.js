function buildHelpMessage() {
  return [
    'Commandes disponibles:',
    '  help     Affiche cette aide',
    '  config   Affiche la configuration persistée effective',
    '  sys-config Affiche la configuration système',
    '  tasks    Affiche les informations du task manager',
    '  task-manager Alias de tasks',
    '  tokens   Liste les tokens en base',
    '  open-qr  Ouvre la page du code QR sur le serveur',
    '  qr       Alias de open-qr',
  ].join('\n');
}

function normalizeCommand(input) {
  return String(input || '').trim().toLowerCase();
}

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

export async function executeCliCommand(services, input) {
  const command = normalizeCommand(input);

  if (!command || command === 'help') {
    return {
      ok: true,
      message: buildHelpMessage(),
    };
  }

  if (command === 'open-qr' || command === 'qr') {
    const result = await services.getRemotes().adminActions.openQrBrowserServer();
    return {
      ok: Boolean(result?.ok),
      message: String(result?.message || 'Commande executee.'),
    };
  }

  if (command === 'config') {
    return {
      ok: true,
      message: 'Configuration persistée effective.',
      data: services.getConfig(),
    };
  }

  if (command === 'sys-config') {
    return {
      ok: true,
      message: 'Configuration système.',
      data: services.getSystemConfig(),
    };
  }

  if (command === 'tasks' || command === 'task-manager') {
    return {
      ok: true,
      message: 'Etat du task manager.',
      data: {
        now: new Date().toISOString(),
        tasks: services.getTaskManager().getTasksSnapshot().map(mapTask),
      },
    };
  }

  if (command === 'tokens') {
    const tokens = Array.from(
      services.getPersistence().entryTokenDao.loadEntryTokens(),
      ([token, createdAt]) => ({
        token,
        createdAt,
      }),
    );

    return {
      ok: true,
      message: 'Tokens chargés.',
      data: tokens,
    };
  }

  return {
    ok: false,
    message: `Commande inconnue: ${command}`,
  };
}
