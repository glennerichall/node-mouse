import {CONFIG_PATHS} from '../services/config/configPaths.js';
import {
  adminConfigSchema,
  coerceConfigValue,
  getFieldDefinition,
  getValueAtPath,
} from '../connection/api/admin-config.shared.js';
import {setNestedValue} from '../../utils/shared/objet.utils.js';

function buildHelpMessage() {
  return [
    'Commandes disponibles:',
    '  help     Affiche cette aide',
    '  config   Affiche la configuration persistée effective',
    '  config get <path> Affiche une valeur de configuration',
    '  config set <path> <value> Met a jour une valeur de configuration',
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
        value: getValueAtPath(services.getConfig(), pathKey),
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
      const nextConfig = {};
      setNestedValue(nextConfig, pathKey, nextValue);
      services.getPersistence().configDao.saveStoredConfig(nextConfig, CONFIG_PATHS);

      return {
        ok: true,
        message: `Configuration ${pathKey} mise a jour.`,
        data: {
          path: pathKey,
          value: getValueAtPath(services.getConfig(), pathKey),
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
