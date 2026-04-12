import {chooseUpdateCheckSource} from "./chooseUpdateCheckSource.js";
import {chooseUpdateInstallSource} from "./chooseUpdateInstallSource.js";
import {
    PUBSUB_EVENT_UPDATE_AVAILABLE,
    PUBSUB_EVENT_UPDATE_CHECK,
    PUBSUB_EVENT_UPDATE_ERROR,
    PUBSUB_SERVICE_UPDATE_MANAGER
} from "../pubsub/serviceEventConstants.js";
import {createLogger} from '../../application/logger.js';

export function createUpdateManager(services) {
    const log = createLogger('update-check');
    let lastKey = '';
    let lastInstallCommand = '';
    let lastResult = null;

    function publishState(type = PUBSUB_EVENT_UPDATE_CHECK) {
        services.getEvents().publishState(PUBSUB_SERVICE_UPDATE_MANAGER, {
            enabled: Boolean(services.getConfig().updateCheck?.enabled),
            lastKey,
            lastInstallCommand,
            lastResult,
        }, {type});
    }

    async function check() {
        if (!services.getConfig().updateCheck?.enabled) {
            lastResult = {
                checked: true,
                hasUpdate: false,
                skipped: true,
                checkedAt: new Date().toISOString(),
            };
            publishState(PUBSUB_EVENT_UPDATE_CHECK);
            return {
                checked: true,
                hasUpdate: false,
            };
        }

        try {
            const result = await chooseUpdateCheckSource(services)();

            if (!result?.hasUpdate || !result.key || result.key === lastKey) {
                log.debug('Update check: no update');
                lastResult = {
                    checked: true,
                    hasUpdate: false,
                    checkedAt: new Date().toISOString(),
                };
                publishState(PUBSUB_EVENT_UPDATE_CHECK);
                return {
                    checked: true,
                    hasUpdate: false,
                };
            }

            lastKey = result.key;
            lastResult = {
                checked: true,
                hasUpdate: true,
                key: result.key,
                title: result.title,
                message: result.message,
                ttlMs: result.ttlMs || 8000,
                checkedAt: new Date().toISOString(),
            };
            publishState(PUBSUB_EVENT_UPDATE_AVAILABLE);
            return {
                checked: true,
                hasUpdate: true,
                key: result.key,
            };
        } catch (_error) {
            log.error({err: _error}, 'Update check: error');
            lastResult = {
                checked: false,
                hasUpdate: false,
                checkedAt: new Date().toISOString(),
                error: _error.message,
            };
            publishState(PUBSUB_EVENT_UPDATE_ERROR);
            return {
                checked: false,
                hasUpdate: false,
            };
        }
    }

    async function update() {
        const install = chooseUpdateInstallSource(services);
        lastInstallCommand = String(install.command || '');
        log.info({installCommand: lastInstallCommand}, 'Exécution commande install update');
        const result = await install();
        if (result.ok) {
            log.info('Install update terminée avec succès');
            return result;
        }
        if (result?.status === 'failed') {
            log.error({details: result.details}, 'Install update en échec');
        }
        return result;
    }

    return {
        check,
        update,
    }
}
