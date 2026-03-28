import {getStartupConfigSnapshot} from '../init/config.js';
import {createLogger} from '../log/logger.js';

const config = getStartupConfigSnapshot();
const log = createLogger('admin:force-update-check');

export function createForceUpdateCheckAction({ notifier, updateChecker }) {
  return async function forceUpdateCheck() {
    if (!config.adminActionsEnabled) {
      log.warn('Force update check refusé: admin actions désactivées');
      notifier.notify({
        level: 'warning',
        title: 'Check update',
        message: `Update desactivée (ADMIN_ACTIONS_ENABLED=false).`,
      });
      return { ok: false, message: 'Actions admin desactivees.(UPDATE_CHECK_ENABLED=false).' };
    }

    log.info('Début force update check');
    const result = await updateChecker.runNow();
    if (result && result.disabled) {
      log.warn('Force update check ignoré: update check désactivé');
      return { ok: false, message: 'Update check desactive (UPDATE_CHECK_ENABLED=false).' };
    }

    if (result && result.checked && result.hasUpdate) {
      log.info('Force update check: mise à jour détectée');
      notifier.notify({
        level: 'warning',
        title: 'Check update',
        message: 'Mise a jour detectee.',
        ttlMs: 2500,
      });
      return { ok: true, message: 'Mise a jour detectee.' };
    }

    log.info('Force update check: aucune mise à jour détectée');
    notifier.notify({
      level: 'info',
      title: 'Check update',
      message: 'Aucune nouvelle mise a jour detectee.',
      ttlMs: 2200,
    });
    return { ok: true, message: 'Aucune mise a jour detectee.' };
  };
}
