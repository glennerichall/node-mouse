import { ADMIN_ACTIONS_ENABLED } from '../config.js';

export function createForceUpdateCheckAction({ notifier, updateChecker }) {
  return async function forceUpdateCheck() {
    if (!ADMIN_ACTIONS_ENABLED) {
      notifier.notify({
        level: 'warning',
        title: 'Check update',
        message: `Update desactivée (ADMIN_ACTIONS_ENABLED=false).`,
      });
      return { ok: false, message: 'Actions admin desactivees.(UPDATE_CHECK_ENABLED=false).' };
    }

    const result = await updateChecker.runNow();
    if (result && result.disabled) {
      return { ok: false, message: 'Update check desactive (UPDATE_CHECK_ENABLED=false).' };
    }

    if (result && result.checked && result.hasUpdate) {
      notifier.notify({
        level: 'warning',
        title: 'Check update',
        message: 'Mise a jour detectee.',
        ttlMs: 2500,
      });
      return { ok: true, message: 'Mise a jour detectee.' };
    }

    notifier.notify({
      level: 'info',
      title: 'Check update',
      message: 'Aucune nouvelle mise a jour detectee.',
      ttlMs: 2200,
    });
    return { ok: true, message: 'Aucune mise a jour detectee.' };
  };
}
