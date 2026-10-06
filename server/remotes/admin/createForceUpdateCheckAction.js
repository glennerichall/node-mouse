import {createLogger} from '../../application/logger.js';
import {
    PUBSUB_EVENT_ADMIN_COMPLETED,
    PUBSUB_SERVICE_ADMIN_FORCE_UPDATE_CHECK
} from "../../services/pubsub/serviceEventConstants.js";

let log;
function getModuleLog() {
    log ??= createLogger('admin:force-update-check');
    return log;
}

export function createForceUpdateCheckAction(services) {
    const log = getModuleLog();
    const {
        getEvents,
        getUpdateManager
    } = services;
    return async function forceUpdateCheck({clientId} = {}) {
        log.info('Starting forced update check');
        const result = await getUpdateManager().check({force: true});

        if (result && result.checked && result.hasUpdate) {
            log.info('Forced update check: update detected');
            getEvents().publishEvent(PUBSUB_SERVICE_ADMIN_FORCE_UPDATE_CHECK, PUBSUB_EVENT_ADMIN_COMPLETED, {
                clientId,
                hasUpdate: true,
            });
            return {ok: true, message: 'Mise a jour detectee.'};
        }

        log.info('Forced update check: no update detected');
        getEvents().publishEvent(PUBSUB_SERVICE_ADMIN_FORCE_UPDATE_CHECK, PUBSUB_EVENT_ADMIN_COMPLETED, {
            clientId,
            hasUpdate: false,
        });
        return {ok: true, message: 'Aucune mise a jour detectee.'};
    };
}
