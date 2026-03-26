import {
  ADMIN_ACTIONS_ENABLED,
  UPDATE_INSTALL_COMMAND,
  UPDATE_INSTALL_TIMEOUT_SEC,
} from '../config.js';
import { execShell, truncateText } from './helpers.js';

export function createInstallUpdateAction({ notifier, updateChecker }) {
  return async function installUpdate() {
    if (!ADMIN_ACTIONS_ENABLED) {
      return { ok: false, message: 'Actions admin desactivees.' };
    }

    const inferredCommand = updateChecker && typeof updateChecker.getInstallCommand === 'function'
      ? String(updateChecker.getInstallCommand() || '').trim()
      : '';
    const installCommand = String(UPDATE_INSTALL_COMMAND || '').trim() || inferredCommand;

    if (!installCommand) {
      notifier.notify({
        level: 'error',
        title: 'Update install',
        message: 'Aucune commande update disponible (configurer UPDATE_INSTALL_COMMAND ou UPDATE_CHECK_PACKAGE).',
        ttlMs: 3600,
      });
      return {
        ok: false,
        message: 'Aucune commande update disponible.',
      };
    }

    notifier.notify({
      level: 'warning',
      title: 'Update install',
      message: 'Installation de mise a jour demarree...',
      ttlMs: 2200,
    });

    const timeoutMs = Math.max(10_000, UPDATE_INSTALL_TIMEOUT_SEC * 1000);
    const result = await execShell(installCommand, timeoutMs);
    if (result.ok) {
      notifier.notify({
        level: 'info',
        title: 'Update install',
        message: 'Installation terminee avec succes.',
        ttlMs: 3200,
      });
      return { ok: true, message: 'Installation terminee.' };
    }

    const details = truncateText(result.stderr || result.stdout || 'Erreur inconnue');
    notifier.notify({
      level: 'error',
      title: 'Update install',
      message: `Echec installation: ${details}`,
      ttlMs: 5000,
    });

    return { ok: false, message: `Echec installation: ${details}` };
  };
}
