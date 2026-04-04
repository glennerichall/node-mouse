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
  preview: {
    title: 'Apercu curseur',
    description: "Qualite et cadence de l'apercu diffuse au client.",
    fields: {
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
    },
  },
  notifications: {
    title: 'Notifications',
    description: 'Reglage des notifications serveur et client.',
    fields: {
      desktop: {
        label: 'Notifications desktop',
        type: 'boolean',
      },
      client: {
        label: 'Notifications client',
        type: 'boolean',
      },
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
