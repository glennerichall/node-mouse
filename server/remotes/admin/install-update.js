import { execShell } from '../../utils/process.js';
import {createLogger} from '../../services/log/logger.js';
import {truncateText} from "../../utils/truncateText.js";
import {buildNpmGlobalUpdateCommand} from '../../services/update-manager/buildNpmGlobalUpdateCommand.js';
import {
  PUBSUB_EVENT_ADMIN_COMPLETED,
  PUBSUB_EVENT_ADMIN_FAILED,
  PUBSUB_EVENT_ADMIN_REJECTED_NO_COMMAND,
  PUBSUB_EVENT_ADMIN_STARTED,
  PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE,
} from '../../services/pubsub/serviceEventConstants.js';

const log = createLogger('admin:install-update');

export function createInstallUpdateAction(servicesOrOptions) {
  const getEvents = servicesOrOptions?.getEvents
    ? () => servicesOrOptions.getEvents()
    : () => servicesOrOptions.events;
  const getUpdateManager = servicesOrOptions?.getUpdateManager
    ? () => servicesOrOptions.getUpdateManager()
    : () => servicesOrOptions.updateManager;
  const getConfig = servicesOrOptions?.getConfig
    ? () => servicesOrOptions.getConfig()
    : servicesOrOptions.getConfig;

  return async function installUpdate({ clientId } = {}) {
    const config = getConfig();
    const events = getEvents();
    const updateManager = getUpdateManager();
    log.info('Début install update');
    const inferredCommand = updateManager && typeof updateManager.getInstallCommand === 'function'
      ? String(updateManager.getInstallCommand() || '').trim()
      : '';
    const npmFallbackCommand = buildNpmGlobalUpdateCommand(config.updateCheck.packageName);
    const installCommand = String(config.updateCheck.installCommand || '').trim() || inferredCommand || npmFallbackCommand;

    if (!installCommand) {
      log.warn('Install update impossible: aucune commande disponible');
      events.publishEvent(PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE, PUBSUB_EVENT_ADMIN_REJECTED_NO_COMMAND, {
        clientId,
      });
      return {
        ok: false,
        message: 'Aucune commande update disponible.',
      };
    }

    events.publishEvent(PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE, PUBSUB_EVENT_ADMIN_STARTED, {
      clientId,
    });

    const timeoutMs = Math.max(10_000, config.updateCheck.installTimeoutSec * 1000);
    log.info({ timeoutMs, installCommand }, 'Exécution commande install update');
    const result = await execShell(installCommand, timeoutMs);
    if (result.ok) {
      log.info('Install update terminée avec succès');
      events.publishEvent(PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE, PUBSUB_EVENT_ADMIN_COMPLETED, {
        clientId,
      });
      return { ok: true, message: 'Installation terminee.' };
    }

    const details = truncateText(result.stderr || result.stdout || 'Erreur inconnue');
    log.error({ details }, 'Install update en échec');
    events.publishEvent(PUBSUB_SERVICE_ADMIN_INSTALL_UPDATE, PUBSUB_EVENT_ADMIN_FAILED, {
      clientId,
      details,
    });

    return { ok: false, message: `Echec installation: ${details}` };
  };
}
