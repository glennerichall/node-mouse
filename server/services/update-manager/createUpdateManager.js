import {chooseUpdateCheckSource} from "./chooseUpdateCheckSource.js";
import {chooseUpdateInstallSource} from "./chooseUpdateInstallSource.js";
import {
    PUBSUB_EVENT_UPDATE_AVAILABLE,
    PUBSUB_EVENT_UPDATE_CHECK,
    PUBSUB_EVENT_UPDATE_ERROR,
    PUBSUB_SERVICE_UPDATE_MANAGER
} from "../pubsub/serviceEventConstants.js";

export function createUpdateManager(services) {
    let lastKey = '';
    let lastInstallCommand = '';
    let lastResult = null;

    function publishState(type = PUBSUB_EVENT_UPDATE_CHECK) {
        if (typeof services.getEvents !== 'function') {
            return;
        }

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
                services.getLogger('update-check').debug('Update check: no update');
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
            services.getLogger('update-check').error({err: _error}, 'Update check: error');
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
        services.getLogger('update-check').info({installCommand: lastInstallCommand}, 'Exécution commande install update');
        const result = await install();
        if (result.ok) {
            services.getLogger('update-check').info('Install update terminée avec succès');
            return result;
        }
        if (result?.status === 'failed') {
            services.getLogger('update-check').error({details: result.details}, 'Install update en échec');
        }
        return result;
    }

    return {
        check,
        update,
    }
}
