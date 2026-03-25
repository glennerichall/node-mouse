import { ADMIN_ACTIONS_ENABLED } from '../../utils/config.js';

export function createForceUpdateCheckAction({ notifier, updateChecker }) {
  return async function forceUpdateCheck() {
    if (!ADMIN_ACTIONS_ENABLED) {
      return { ok: false, message: 'Actions admin desactivees.' };
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
