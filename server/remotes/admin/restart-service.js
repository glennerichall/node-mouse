import { commandExists, spawnDetached } from '../../utils/process.js';
import {NOTIFIER_LEVEL_WARNING, NOTIFIER_TARGET_CLIENT} from '../../services/notifier/createNotifierComposite.js';
import { writeRestartMarker } from './restart-marker.js';

export function createRestartServiceAction(servicesOrOptions) {
  const getNotifier = servicesOrOptions?.getNotifier
    ? () => servicesOrOptions.getNotifier()
    : () => servicesOrOptions.notifier;
  const getSystemConfig = servicesOrOptions?.getSystemConfig
    ? () => servicesOrOptions.getSystemConfig()
    : () => servicesOrOptions?.systemConfig;

  return async function restartService({ clientId } = {}) {
    const config = getSystemConfig();
    const notifier = getNotifier();
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
