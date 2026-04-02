import {chooseUpdateSource} from "./chooseUpdateSource.js";
import {
    NOTIFIER_LEVEL_WARNING,
} from "../notifier/createNotifierComposite.js";

export function createUpdateManager(services) {
    let lastKey = '';
    let lastInstallCommand = '';
    let lastResult = null;

    function getLog() {
        return services.getLogger('update-check');
    }

    function getSource() {
        return chooseUpdateSource(services);
    }

    function getUpdateConfig() {
        return services.getConfig().updateCheck || {};
    }

    function publishState(type = 'state.changed') {
        if (typeof services.getPubSub !== 'function') {
            return;
        }

        services.getPubSub().publish('update-manager', {
            enabled: Boolean(getUpdateConfig().enabled),
            lastKey,
            lastInstallCommand,
            lastResult,
        }, {type});
    }

    async function checkOnce() {
        if (!getUpdateConfig().enabled) {
            lastResult = {
                checked: true,
                hasUpdate: false,
                skipped: true,
                checkedAt: new Date().toISOString(),
            };
            publishState('update.check');
            return {
                checked: true,
                hasUpdate: false,
            };
        }
        try {
            const source = getSource();
            lastInstallCommand = String(source.getInstallCommand?.() || '').trim();
            const result = await source.check();
            if (!result || !result.hasUpdate || !result.key || result.key === lastKey) {
                getLog().debug('Update check: no update');
                lastResult = {
                    checked: true,
                    hasUpdate: false,
                    checkedAt: new Date().toISOString(),
                };
                publishState('update.check');
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
                checkedAt: new Date().toISOString(),
            };
            services.getNotifier().notify({
                level: NOTIFIER_LEVEL_WARNING,
                title: result.title,
                message: result.message,
                ttlMs: result.ttlMs || 8000,
            });
            publishState('update.available');
            return {
                checked: true,
                hasUpdate: true,
                key: result.key,
            };
        } catch (_error) {
            getLog().error({err: _error}, 'Update check: error');
            lastResult = {
                checked: false,
                hasUpdate: false,
                checkedAt: new Date().toISOString(),
                error: _error.message,
            };
            publishState('update.error');
            return {
                checked: false,
                hasUpdate: false,
            };
        }
    }

    return {
        runNow: () => checkOnce(),
        getInstallCommand: () => lastInstallCommand || String(getSource().getInstallCommand?.() || '').trim(),
        update: () => checkOnce(),
        check: () => checkOnce(),
        publishState,
    }
}
