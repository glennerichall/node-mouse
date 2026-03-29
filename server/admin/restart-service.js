import {getStartupConfigSnapshot} from '../init/config.js';
import { commandExists, spawnDetached } from '../utils/process.js';
import { writeRestartMarker } from './restart-marker.js';

const config = getStartupConfigSnapshot();

export function createRestartServiceAction({ notifier }) {
  return async function restartService({ clientId } = {}) {
    if (!(await commandExists('systemctl'))) {
      return { ok: false, message: 'systemctl indisponible.' };
    }

    writeRestartMarker();
    notifier.notify({
      level: 'warning',
      title: 'Redemarrage service',
      message: `Redemarrage de ${config.serviceName} en cours...`,
      ttlMs: 2200,
      target: 'client',
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
