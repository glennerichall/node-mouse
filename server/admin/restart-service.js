import { spawn } from 'child_process';
import {getStartupConfigSnapshot} from '../init/config.js';
import { commandExists } from './helpers.js';
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

    const child = spawn(
      'bash',
      ['-lc', `sleep 0.8; systemctl --user restart ${config.serviceName}`],
      {
        detached: true,
        stdio: 'ignore',
      },
    );
    child.unref();

    return { ok: true, message: `Redemarrage demande pour ${config.serviceName}.` };
  };
}
