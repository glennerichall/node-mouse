import {chooseUpdateSource} from "./chooseUpdateSource.js";
import {
    NOTIFIER_LEVEL_WARNING,
} from "../notifier/createNotifierComposite.js";

export function createUpdateManager(services) {
    let active = false;
    let timer = null;
    let lastKey = '';

    function getLog() {
        return services.getLogger('update-check');
    }

    function getSource() {
        return chooseUpdateSource(services);
    }

    function getUpdateConfig() {
        return services.getConfig().updateCheck || {};
    }

    function getIntervalMs() {
        const intervalMin = Math.max(1, Number(services.getSystemConfig().updateCheck?.intervalMin) || 1);
        return Math.max(60_000, intervalMin * 60_000);
    }

    async function checkOnce() {
        if (!getUpdateConfig().enabled) {
            return {
                checked: true,
                hasUpdate: false,
            };
        }
        try {
            const source = getSource();
            const result = await source.check();
            if (!result || !result.hasUpdate || !result.key || result.key === lastKey) {
                getLog().debug('Update check: no update');
                return {
                    checked: true,
                    hasUpdate: false,
                };
            }

            lastKey = result.key;
            services.getNotifier().notify({
                level: NOTIFIER_LEVEL_WARNING,
                title: result.title,
                message: result.message,
                ttlMs: result.ttlMs || 8000,
            });
            return {
                checked: true,
                hasUpdate: true,
                key: result.key,
            };
        } catch (_error) {
            getLog().error({err: _error}, 'Update check: error');
            return {
                checked: false,
                hasUpdate: false,
            };
        }
    }

    function schedule() {
        timer = setInterval(() => {
            if (active) {
                checkOnce();
            }
        }, getIntervalMs());
    }

    async function start() {
        if (active) {
            return;
        }
        if (!getUpdateConfig().enabled) {
            getLog().info('Auto update-check disabled (manual runNow remains enabled)');
            return;
        }
        active = true;
        await checkOnce();
        schedule();
    }

    async function stop() {
        active = false;
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    return {
        start,
        stop,
        runNow: () => checkOnce(),
        getInstallCommand: () => getSource().getInstallCommand?.() || '',
        update: () => checkOnce(),
        check: () => getSource().check(),
    }
}
