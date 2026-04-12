import {CONFIG_PATHS} from '../../services/config/configPaths.js';
import {
  adminConfigSchema,
  coerceConfigValue,
  getFieldDefinition,
} from '../../connection/api/configs.js';

export async function executeConfigCommand(services, args = {}) {
  if (!args.action) {
    return {
      ok: true,
      message: 'Configuration persistée effective.',
      data: services.getConfig(),
    };
  }

  if (args.action === 'get') {
    const pathKey = String(args.path || '').trim();
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

  if (args.action === 'set') {
    const pathKey = String(args.path || '').trim();
    if (!CONFIG_PATHS.includes(pathKey)) {
      return {
        ok: false,
        message: `Chemin de configuration invalide: ${pathKey || '(vide)'}`,
      };
    }

    if (args.value === '') {
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
      const nextValue = coerceConfigValue(String(args.value || ''), field);
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

  return {
    ok: false,
    message: `Action config inconnue: ${args.action}`,
  };
}
