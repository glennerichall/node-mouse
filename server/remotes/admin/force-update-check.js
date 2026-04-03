import {createLogger} from '../../services/log/logger.js';
import {
    PUBSUB_EVENT_ADMIN_COMPLETED,
    PUBSUB_SERVICE_ADMIN_FORCE_UPDATE_CHECK
} from "../../services/pubsub/serviceEventConstants.js";

const log = createLogger('admin:force-update-check');

export function createForceUpdateCheckAction(services) {
    const {
        getEvents,
        getUpdateManager
    } = services;
    return async function forceUpdateCheck({clientId} = {}) {
        log.info('Début force update check');
        const result = await getUpdateManager().runNow();

        if (result && result.checked && result.hasUpdate) {
            log.info('Force update check: mise à jour détectée');
            getEvents().publishEvent(PUBSUB_SERVICE_ADMIN_FORCE_UPDATE_CHECK, PUBSUB_EVENT_ADMIN_COMPLETED, {
                clientId,
                hasUpdate: true,
            });
            return {ok: true, message: 'Mise a jour detectee.'};
        }

        log.info('Force update check: aucune mise à jour détectée');
        getEvents().publishEvent(PUBSUB_SERVICE_ADMIN_FORCE_UPDATE_CHECK, PUBSUB_EVENT_ADMIN_COMPLETED, {
            clientId,
            hasUpdate: false,
        });
        return {ok: true, message: 'Aucune mise a jour detectee.'};
    };
}
