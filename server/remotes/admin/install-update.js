import { execShell } from '../../utils/process.js';
import {createLogger} from '../../services/log/logger.js';
import {truncateText} from "../../utils/truncateText.js";
import {buildNpmGlobalUpdateCommand} from '../../services/update-manager/buildNpmGlobalUpdateCommand.js';
import {
  NOTIFIER_LEVEL_ERROR,
  NOTIFIER_LEVEL_INFO,
  NOTIFIER_LEVEL_WARNING,
  NOTIFIER_TARGET_CLIENT,
} from '../../services/notifier/createNotifierComposite.js';

const log = createLogger('admin:install-update');

export function createInstallUpdateAction(servicesOrOptions) {
  const getNotifier = servicesOrOptions?.getNotifier
    ? () => servicesOrOptions.getNotifier()
    : () => servicesOrOptions.notifier;
  const getUpdateManager = servicesOrOptions?.getUpdateManager
    ? () => servicesOrOptions.getUpdateManager()
    : () => servicesOrOptions.updateManager;
  const getConfig = servicesOrOptions?.getConfig
    ? () => servicesOrOptions.getConfig()
    : servicesOrOptions.getConfig;

  return async function installUpdate({ clientId } = {}) {
    const config = getConfig();
    const notifier = getNotifier();
    const updateManager = getUpdateManager();
    log.info('Début install update');
    const inferredCommand = updateManager && typeof updateManager.getInstallCommand === 'function'
      ? String(updateManager.getInstallCommand() || '').trim()
      : '';
    const npmFallbackCommand = buildNpmGlobalUpdateCommand(config.updateCheck.packageName);
    const installCommand = String(config.updateCheck.installCommand || '').trim() || inferredCommand || npmFallbackCommand;

    if (!installCommand) {
      log.warn('Install update impossible: aucune commande disponible');
      notifier.target(NOTIFIER_TARGET_CLIENT).notify({
        level: NOTIFIER_LEVEL_ERROR,
        title: 'Update install',
        message: 'Aucune commande update disponible (configurer UPDATE_INSTALL_COMMAND ou UPDATE_CHECK_PACKAGE).',
        ttlMs: 3600,
      }, {
        clientId,
      });
      return {
        ok: false,
        message: 'Aucune commande update disponible.',
      };
    }

    notifier.target(NOTIFIER_TARGET_CLIENT).notify({
      level: NOTIFIER_LEVEL_WARNING,
      title: 'Update install',
      message: 'Installation de mise a jour demarree...',
      ttlMs: 2200,
    }, {
      clientId,
    });

    const timeoutMs = Math.max(10_000, config.updateCheck.installTimeoutSec * 1000);
    log.info({ timeoutMs, installCommand }, 'Exécution commande install update');
    const result = await execShell(installCommand, timeoutMs);
    if (result.ok) {
      log.info('Install update terminée avec succès');
      notifier.target(NOTIFIER_TARGET_CLIENT).notify({
        level: NOTIFIER_LEVEL_INFO,
        title: 'Update install',
        message: 'Installation terminee avec succes.',
        ttlMs: 3200,
      }, {
        clientId,
      });
      return { ok: true, message: 'Installation terminee.' };
    }

    const details = truncateText(result.stderr || result.stdout || 'Erreur inconnue');
    log.error({ details }, 'Install update en échec');
    notifier.target(NOTIFIER_TARGET_CLIENT).notify({
      level: NOTIFIER_LEVEL_ERROR,
      title: 'Update install',
      message: `Echec installation: ${details}`,
      ttlMs: 5000,
    }, {
      clientId,
    });

    return { ok: false, message: `Echec installation: ${details}` };
  };
}
