import {getConfig} from '../../init/config/index.js';
import { commandExists, spawnDetached } from '../../utils/process.js';
import {NOTIFIER_LEVEL_WARNING, NOTIFIER_TARGET_CLIENT} from '../../notifier/notifier-composite.js';
import { writeRestartMarker } from './restart-marker.js';

export function createRestartServiceAction({ notifier }) {
  return async function restartService({ clientId } = {}) {
    const config = getConfig();
    if (!(await commandExists('systemctl'))) {
      return { ok: false, message: 'systemctl indisponible.' };
    }

    writeRestartMarker();
    notifier.target(NOTIFIER_TARGET_CLIENT).notify({
      level: NOTIFIER_LEVEL_WARNING,
      title: 'Redemarrage service',
      message: `Redemarrage de ${config.serviceName} en cours...`,
      ttlMs: 2200,
    }, {
      clientId,
    });

    const spawned = await spawnDetached(
      'bash',
      ['-lc', `sleep 0.8; systemctl --user restart ${config.serviceName}`],
    );
    if (!spawned) {
      return { ok: false, message: 'Impossible de lancer la commande de redemarrage.' };
    }

    return { ok: true, message: `Redemarrage demande pour ${config.serviceName}.` };
  };
}
