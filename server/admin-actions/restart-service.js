import { spawn } from 'child_process';
import { ADMIN_ACTIONS_ENABLED, SERVICE_NAME } from '../../utils/config.js';
import { commandExists } from './helpers.js';
import { writeRestartMarker } from './restart-marker.js';

export function createRestartServiceAction({ notifier }) {
  return async function restartService() {
    if (!ADMIN_ACTIONS_ENABLED) {
      return { ok: false, message: 'Actions admin desactivees.' };
    }

    if (!(await commandExists('systemctl'))) {
      return { ok: false, message: 'systemctl indisponible.' };
    }

    writeRestartMarker();
    notifier.notify({
      level: 'warning',
      title: 'Redemarrage service',
      message: `Redemarrage de ${SERVICE_NAME} en cours...`,
      ttlMs: 2200,
    });

    const child = spawn(
      'bash',
      ['-lc', `sleep 0.8; systemctl --user restart ${SERVICE_NAME}`],
      {
        detached: true,
        stdio: 'ignore',
      },
    );
    child.unref();

    return { ok: true, message: `Redemarrage demande pour ${SERVICE_NAME}.` };
  };
}
