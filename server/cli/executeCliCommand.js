import {CONFIG_PATHS} from '../services/config/configPaths.js';
import {
  adminConfigSchema,
  coerceConfigValue,
  getFieldDefinition,
  getValueAtPath,
} from '../connection/api/configs.js';
import {
  getSamsungDeviceMac,
  pickSamsungDevice,
} from '../remotes/samsung/device-config.js';

function buildHelpMessage() {
  return [
    'Commandes disponibles:',
    '  help     Affiche cette aide',
    '  config   Affiche la configuration persistée effective',
    '  config get <path> Affiche une valeur de configuration',
    '  config set <path> <value> Met a jour une valeur de configuration',
    '  sys-config Affiche la configuration système',
    '  info     Affiche les capacites du serveur',
    '  system-info Alias de info',
    '  service install Installe le daemon/service local',
    '  service disable Desactive le daemon/service local',
    '  service uninstall Desinstalle le daemon/service local',
    '  service restart Redemarre le daemon/service local',
    '  tasks    Affiche les informations du task manager',
    '  task-manager Alias de tasks',
    '  samsung-detect Detecte une TV Samsung',
    '  tokens   Liste les tokens en base',
    '  open-qr  Ouvre la page du code QR sur le serveur',
    '  qr       Alias de open-qr',
  ].join('\n');
}

function normalizeCommand(input) {
  return String(input || '').trim().toLowerCase();
}

function tokenizeCommand(input) {
  return String(input || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function normalizeSubcommand(value) {
  return String(value || '').trim().toLowerCase();
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
  const tokens = tokenizeCommand(input);
  const primaryCommand = normalizeSubcommand(tokens[0]);

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

  if (primaryCommand === 'config' && tokens.length === 1) {
    return {
      ok: true,
      message: 'Configuration persistée effective.',
      data: services.getConfig(),
    };
  }

  if (primaryCommand === 'config' && normalizeSubcommand(tokens[1]) === 'get') {
    const pathKey = String(tokens[2] || '').trim();
    if (!CONFIG_PATHS.includes(pathKey)) {
      return {
        ok: false,
        message: `Chemin de configuration invalide: ${pathKey || '(vide)'}`,
      };
    }

      return {
        ok: true,
        message: `Configuration ${pathKey}.`,
        data: {
          path: pathKey,
          value: services.getConfigService().getConfig(pathKey),
        },
      };
  }

  if (primaryCommand === 'config' && normalizeSubcommand(tokens[1]) === 'set') {
    const pathKey = String(tokens[2] || '').trim();
    if (!CONFIG_PATHS.includes(pathKey)) {
      return {
        ok: false,
        message: `Chemin de configuration invalide: ${pathKey || '(vide)'}`,
      };
    }

    if (tokens.length < 4) {
      return {
        ok: false,
        message: 'Valeur de configuration manquante.',
      };
    }

    const field = getFieldDefinition(adminConfigSchema, pathKey);
    if (!field) {
      return {
        ok: false,
        message: `Champ de configuration inconnu: ${pathKey}`,
      };
    }

    try {
      const rawValue = tokens.slice(3).join(' ');
      const nextValue = coerceConfigValue(rawValue, field);
      services.getConfigService().setConfig(pathKey, nextValue);

      return {
        ok: true,
        message: `Configuration ${pathKey} mise a jour.`,
        data: {
          path: pathKey,
          value: services.getConfigService().getConfig(pathKey),
        },
      };
    } catch (error) {
      return {
        ok: false,
        message: `Configuration invalide: ${error.message}`,
      };
    }
  }

  if (command === 'sys-config') {
    return {
      ok: true,
      message: 'Configuration système.',
      data: services.getSystemConfig(),
    };
  }

  if (command === 'info' || command === 'system-info') {
    return {
      ok: true,
      message: 'Capacites du serveur.',
      data: await services.getSystem().getInfo(),
    };
  }

  if (primaryCommand === 'service' && normalizeSubcommand(tokens[1]) === 'install') {
    return services.getApplicationDaemonService().install();
  }

  if (primaryCommand === 'service' && normalizeSubcommand(tokens[1]) === 'disable') {
    return services.getApplicationDaemonService().disable();
  }

  if (primaryCommand === 'service' && normalizeSubcommand(tokens[1]) === 'uninstall') {
    return services.getApplicationDaemonService().uninstall();
  }

  if (primaryCommand === 'service' && normalizeSubcommand(tokens[1]) === 'restart') {
    return services.getApplicationDaemonService().restart({
      cause: 'user',
      source: 'cli',
    });
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

  if (command === 'samsung-detect') {
    try {
      const samsungConfig = services.getConfig().samsungTv;
      const devices = await services.getRemotes().samsung.discoverDevices();
      const selected = pickSamsungDevice(
        devices,
        samsungConfig.alwaysAutoResolve
          ? {...samsungConfig, host: '', mac: ''}
          : samsungConfig,
      );

      if (!selected) {
        if (!devices.length) {
          return {
            ok: false,
            message: 'Aucune TV Samsung detectee.',
          };
        }

        return {
          ok: false,
          message: 'Plusieurs TV Samsung detectees. Configurez samsungTv.host ou samsungTv.mac, ou desactivez alwaysAutoResolve.',
          data: devices.map((device) => ({
            name: String(device?.name || '').trim(),
            model: String(device?.model || '').trim(),
            host: String(device?.ip || '').trim(),
            mac: getSamsungDeviceMac(device),
          })),
        };
      }

      return {
        ok: true,
        message: 'TV Samsung detectee.',
        data: {
          name: String(selected?.name || '').trim(),
          model: String(selected?.model || '').trim(),
          host: String(selected?.ip || '').trim(),
          mac: getSamsungDeviceMac(selected),
        },
      };
    } catch (error) {
      return {
        ok: false,
        message: String(error?.message || error || 'Decouverte Samsung impossible.'),
      };
    }
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
