import { getNotificationPaths } from '../../../utils/shared/notificationSettings.js';

export const CONFIG_SCHEMA = {
  input: {
    title: 'Souris et entree',
    description: 'Parametres de sensibilite pour le pointeur et le scroll.',
    fields: {
      mouseSpeed: {
        label: 'Vitesse souris',
        type: 'number',
        min: 0.1,
        max: 10,
        step: 0.1,
      },
      scrollSpeed: {
        label: 'Vitesse scroll',
        type: 'number',
        min: 0.05,
        max: 5,
        step: 0.05,
      },
      touchDragHoldMs: {
        label: 'Delai drag tactile (ms)',
        type: 'integer',
        min: 100,
        max: 1500,
        step: 10,
      },
      touchDragStillDistancePx: {
        label: 'Tolerance immobile drag tactile (px)',
        type: 'integer',
        min: 1,
        max: 40,
        step: 1,
      },
    },
  },
  browser: {
    title: 'Navigateur',
    description: 'Active ou masque la remote navigateur pour tous les clients.',
    fields: {
      enabled: {
        label: 'Activer la remote navigateur',
        type: 'boolean',
      },
    },
  },
  keyboard: {
    title: 'Clavier',
    description: 'Active ou masque la remote clavier pour tous les clients.',
    fields: {
      enabled: {
        label: 'Activer la remote clavier',
        type: 'boolean',
      },
    },
  },
  preview: {
    title: 'Apercu curseur',
    description: "Qualite et cadence de l'apercu diffuse au client.",
    fields: {
      enabled: {
        label: 'Activer le preview curseur',
        type: 'boolean',
      },
      width: {
        label: 'Largeur',
        type: 'integer',
        min: 32,
        max: 512,
        step: 1,
      },
      height: {
        label: 'Hauteur',
        type: 'integer',
        min: 24,
        max: 512,
        step: 1,
      },
      fps: {
        label: 'FPS',
        type: 'integer',
        min: 1,
        max: 30,
        step: 1,
      },
      hideDelayMs: {
        label: 'Delai de masque (ms)',
        type: 'integer',
        min: 200,
        max: 60000,
        step: 100,
      },
    },
  },
  notifications: {
    title: 'Notifications',
    description: 'Reglage des notifications par evenement pour le host et le client.',
    fields: {
      ttlMs: {
        label: 'Duree affichage (ms)',
        type: 'integer',
        min: 500,
        max: 10000,
        step: 100,
      },
    },
  },
  samsungTv: {
    title: 'Samsung TV',
    description: 'Connexion, delais et raccourcis pour la TV Samsung.',
    fields: {
      enabled: {
        label: 'Activer Samsung TV',
        type: 'boolean',
      },
      alwaysAutoResolve: {
        label: 'Toujours auto-resoudre',
        type: 'boolean',
      },
      host: {
        label: 'Adresse IP',
        type: 'string',
        placeholder: '192.168.1.50',
      },
      mac: {
        label: 'Adresse MAC',
        type: 'string',
        placeholder: 'AA:BB:CC:DD:EE:FF',
      },
      port: {
        label: 'Port',
        type: 'integer',
        min: 1,
        max: 65535,
        step: 1,
      },
      appName: {
        label: 'Nom application',
        type: 'string',
        placeholder: 'Remote Mouse',
      },
      discoveryTimeoutMs: {
        label: 'Timeout decouverte (ms)',
        type: 'integer',
        min: 100,
        max: 20000,
        step: 100,
      },
      timeoutMs: {
        label: 'Timeout commande (ms)',
        type: 'integer',
        min: 500,
        max: 60000,
        step: 100,
      },
      pcInputKey: {
        label: 'Touche entree PC',
        type: 'string',
        placeholder: 'KEY_HDMI1',
      },
      pcInputSequence: {
        label: 'Sequence entree PC',
        type: 'string',
        placeholder: 'KEY_SOURCE,KEY_DOWN,KEY_ENTER',
      },
      powerOffKey: {
        label: 'Touche extinction',
        type: 'string',
        placeholder: 'KEY_POWER',
      },
    },
  },
  updateCheck: {
    title: 'Mises a jour',
    description: 'Activation de la verification automatique des mises a jour.',
    fields: {
      enabled: {
        label: 'Activer la verification',
        type: 'boolean',
      },
    },
  },
  qrOverlay: {
    title: 'QR Overlay',
    description: "Reglage de taille et de position de l'overlay QR.",
    fields: {
      enabled: {
        label: "Afficher l'overlay",
        type: 'boolean',
      },
      size: {
        label: 'Taille',
        type: 'integer',
        min: 24,
        max: 400,
        step: 1,
      },
      margin: {
        label: 'Marge',
        type: 'integer',
        min: 0,
        max: 200,
        step: 1,
      },
      topOffsetPx: {
        label: 'Offset haut (px)',
        type: 'integer',
        min: 0,
        max: 500,
        step: 1,
      },
      autoHideOnHover: {
        label: 'Masquage auto au survol',
        type: 'boolean',
      },
      hoverEntryMarginPx: {
        label: "Marge d'entree hover (px)",
        type: 'integer',
        min: 0,
        max: 100,
        step: 1,
      },
      hoverExitMarginPx: {
        label: 'Marge de sortie hover (px)',
        type: 'integer',
        min: 0,
        max: 150,
        step: 1,
      },
      hoverShowDelayMs: {
        label: 'Delai de reaffichage hover (ms)',
        type: 'integer',
        min: 0,
        max: 10000,
        step: 50,
      },
    },
  },
  logging: {
    title: 'Logs',
    description: 'Format et niveau de verbosite.',
    fields: {
      level: {
        label: 'Niveau',
        type: 'string',
        options: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
      },
      format: {
        label: 'Format',
        type: 'string',
        options: ['json', 'pretty'],
      },
    },
  },
};

export function getManagedConfigSchema(managedPaths = []) {
  const allowed = new Set(managedPaths);
  const sections = {};

  for (const [sectionKey, section] of Object.entries(CONFIG_SCHEMA)) {
    const fields = Object.fromEntries(
      Object.entries(section.fields).filter(([fieldKey]) => allowed.has(`${sectionKey}.${fieldKey}`)),
    );

    if (!Object.keys(fields).length) {
      continue;
    }

    sections[sectionKey] = {
      ...section,
      fields,
    };
  }

  return sections;
}

const CONFIG_FIELD_DEFINITIONS = new Map();

for (const [sectionKey, section] of Object.entries(CONFIG_SCHEMA)) {
  for (const [fieldKey, field] of Object.entries(section.fields)) {
    CONFIG_FIELD_DEFINITIONS.set(`${sectionKey}.${fieldKey}`, field);
  }
}

for (const pathKey of getNotificationPaths()) {
  CONFIG_FIELD_DEFINITIONS.set(pathKey, { type: 'boolean' });
}

export function getConfigFieldDefinition(pathKey) {
  return CONFIG_FIELD_DEFINITIONS.get(String(pathKey || '').trim()) || null;
}
