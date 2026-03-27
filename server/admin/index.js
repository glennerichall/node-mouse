import { createForceUpdateCheckAction } from './force-update-check.js';
import { createInstallUpdateAction } from './install-update.js';
import { createRestartServiceAction } from './restart-service.js';
import { notifyIfRestarted } from './restart-marker.js';

export { notifyIfRestarted };

export function createAdminActions({ notifier, updateChecker }) {
  return {
    forceUpdateCheck: createForceUpdateCheckAction({ notifier, updateChecker }),
    installUpdate: createInstallUpdateAction({ notifier, updateChecker }),
    restartService: createRestartServiceAction({ notifier }),
  };
}
