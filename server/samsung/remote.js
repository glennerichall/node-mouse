import { getConfig } from '../init/config/index.js';
import { createLogger } from '../log/logger.js';

import {
  getAwakeSamsungDevices,
  getLastConnectedDevice,
  Keys,
  SamsungTvRemote
} from "samsung-tv-remote";

const log = createLogger('samsung:remote');

function createDisabledRemote(reason) {
  return {
    isEnabled() {
      return false;
    },
    async turnOn() {
      return { ok: false, message: reason };
    },
    async turnOff() {
      return { ok: false, message: reason };
    },
    async volumeUp() {
      return { ok: false, message: reason };
    },
    async volumeDown() {
      return { ok: false, message: reason };
    },
    async switchInput() {
      return { ok: false, message: reason };
    },
  };
}

function toErrorMessage(error) {
  return String(error?.message || error || 'Erreur Samsung inconnue');
}

function createResult(message) {
  return {
    ok: true,
    message,
  };
}

function resolveConfiguredKey(keyName) {
  return Keys[String(keyName || '').trim()] || null;
}

function resolveConfiguredKeysSequence(sequence) {
  return String(sequence || '')
    .split(',')
    .map((entry) => String(entry || '').trim().toUpperCase())
    .filter(Boolean)
    .map((entry) => Keys[entry] || null);
}

function normalizeMac(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-f0-9]/g, '');
}

function pickDevice(candidates, config) {
  const requestedHost = String(config.host || '').trim();
  const requestedMac = normalizeMac(config.mac);

  if (requestedHost) {
    const byHost = candidates.find((candidate) => candidate.ip === requestedHost);
    if (byHost) {
      return byHost;
    }
  }

  if (requestedMac) {
    const byMac = candidates.find((candidate) => normalizeMac(candidate.wifiMac) === requestedMac);
    if (byMac) {
      return byMac;
    }
  }

  if (!requestedHost && !requestedMac && candidates.length === 1) {
    return candidates[0];
  }

  return null;
}

export function createSamsungRemote() {
  const config = getConfig().samsungTv;
  if (!config.enabled) {
    return createDisabledRemote('Controle Samsung desactive. Activez SAMSUNG_TV_ENABLED.');
  }

  let remotePromise = null;

  async function resolveDeviceConfig() {
    if (config.host && config.mac) {
      return {
        ip: config.host,
        mac: config.mac,
      };
    }

    const lastDevice = getLastConnectedDevice();
    const discoveredDevices = await getAwakeSamsungDevices(config.discoveryTimeoutMs);
    const candidates = lastDevice ? [lastDevice, ...discoveredDevices] : discoveredDevices;
    const selected = pickDevice(candidates, config);

    if (!selected) {
      if (!candidates.length) {
        throw new Error('aucune TV Samsung reveillee detectee sur le reseau');
      }

      if (candidates.length > 1) {
        throw new Error('plusieurs TV Samsung detectees, renseignez SAMSUNG_TV_HOST ou SAMSUNG_TV_MAC');
      }

      throw new Error('TV Samsung detectee mais impossible de resoudre host/mac');
    }

    log.info({
      ip: selected.ip,
      name: selected.name,
      model: selected.model,
      wifiMac: selected.wifiMac,
    }, 'TV Samsung detectee automatiquement');

    return {
      ip: selected.ip,
      mac: selected.wifiMac || config.mac,
    };
  }

  async function getRemote() {
    if (!remotePromise) {
      remotePromise = resolveDeviceConfig()
        .then((device) => new SamsungTvRemote({
          device: {
            ip: device.ip,
            mac: device.mac,
          },
          port: config.port,
          name: config.appName,
          timeout: config.timeoutMs,
        }))
        .catch((error) => {
          remotePromise = null;
          throw error;
        });
    }

    return remotePromise;
  }

  async function sendKey(key, successMessage) {
    try {
      const remote = await getRemote();
      await remote.sendKey(key);
      log.info({ key }, 'Commande Samsung envoyee');
      return createResult(successMessage);
    } catch (error) {
      const message = toErrorMessage(error);
      log.warn({ key, err: message }, 'Echec commande Samsung');
      return {
        ok: false,
        message: `TV Samsung indisponible: ${message}`,
      };
    }
  }

  async function sendKeys(keys, successMessage) {
    try {
      const remote = await getRemote();
      await remote.sendKeys(keys);
      log.info({ keys }, 'Sequence Samsung envoyee');
      return createResult(successMessage);
    } catch (error) {
      const message = toErrorMessage(error);
      log.warn({ keys, err: message }, 'Echec sequence Samsung');
      return {
        ok: false,
        message: `TV Samsung indisponible: ${message}`,
      };
    }
  }

  return {
    isEnabled() {
      return true;
    },
    async turnOn() {
      try {
        const remote = await getRemote();
        await remote.wakeTV();
        log.info('Wake-on-LAN Samsung envoye');
        return createResult("Demande d'allumage envoyee a la TV Samsung.");
      } catch (error) {
        const message = toErrorMessage(error);
        log.warn({ err: message }, 'Echec allumage Samsung');
        return {
          ok: false,
          message: `Impossible d'allumer la TV Samsung: ${message}`,
        };
      }
    },
    async turnOff() {
      const powerOffKey = resolveConfiguredKey(config.powerOffKey);
      if (!powerOffKey) {
        return {
          ok: false,
          message: `Touche Samsung invalide pour l'extinction: ${config.powerOffKey}`,
        };
      }
      return sendKey(powerOffKey, "Demande d'extinction envoyee a la TV Samsung.");
    },
    async volumeUp() {
      return sendKey(Keys.KEY_VOLUP, 'Volume Samsung augmente.');
    },
    async volumeDown() {
      return sendKey(Keys.KEY_VOLDOWN, 'Volume Samsung diminue.');
    },
    async switchInput() {
      return sendKey(Keys.KEY_SOURCE, 'Changement de source Samsung demande.');
    },
    async confirm() {
      return sendKey(Keys.KEY_ENTER, 'Validation Samsung envoyee.');
    },
    async switchToPcInput() {
      const configuredSequence = resolveConfiguredKeysSequence(config.pcInputSequence);
      if (configuredSequence.length) {
        if (configuredSequence.some((key) => !key)) {
          return {
            ok: false,
            message: `Sequence Samsung invalide pour l'entree PC: ${config.pcInputSequence}`,
          };
        }
        return sendKeys(
          configuredSequence,
          `Bascule Samsung vers l'entree PC via sequence ${config.pcInputSequence}.`,
        );
      }

      const configuredKey = resolveConfiguredKey(config.pcInputKey);
      if (!configuredKey) {
        return {
          ok: false,
          message: `Touche Samsung invalide pour l'entree PC: ${config.pcInputKey}`,
        };
      }
      return sendKey(configuredKey, `Bascule Samsung vers ${config.pcInputKey}.`);
    },
  };
}
