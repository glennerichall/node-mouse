import {getStartupConfigSnapshot} from '../init/config.js';
import { execShell, truncateText } from './helpers.js';
import {createLogger} from '../log/logger.js';

const config = getStartupConfigSnapshot();
const log = createLogger('admin:install-update');

export function createInstallUpdateAction({ notifier, updateChecker }) {
  return async function installUpdate() {
    if (!config.adminActionsEnabled) {
      log.warn('Install update refusé: admin actions désactivées');
      return { ok: false, message: 'Actions admin desactivees.' };
    }

    log.info('Début install update');
    const inferredCommand = updateChecker && typeof updateChecker.getInstallCommand === 'function'
      ? String(updateChecker.getInstallCommand() || '').trim()
      : '';
    const installCommand = String(config.updateCheck.installCommand || '').trim() || inferredCommand;

    if (!installCommand) {
      log.warn('Install update impossible: aucune commande disponible');
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

    const timeoutMs = Math.max(10_000, config.updateCheck.installTimeoutSec * 1000);
    log.info({ timeoutMs, installCommand }, 'Exécution commande install update');
    const result = await execShell(installCommand, timeoutMs);
    if (result.ok) {
      log.info('Install update terminée avec succès');
      notifier.notify({
        level: 'info',
        title: 'Update install',
        message: 'Installation terminee avec succes.',
        ttlMs: 3200,
      });
      return { ok: true, message: 'Installation terminee.' };
    }

    const details = truncateText(result.stderr || result.stdout || 'Erreur inconnue');
    log.error({ details }, 'Install update en échec');
    notifier.notify({
      level: 'error',
      title: 'Update install',
      message: `Echec installation: ${details}`,
      ttlMs: 5000,
    });

    return { ok: false, message: `Echec installation: ${details}` };
  };
}
