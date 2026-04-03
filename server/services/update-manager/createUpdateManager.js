import {chooseUpdateSource} from "./chooseUpdateSource.js";
import {execShell} from "../../utils/process.js";
import {truncateText} from "../../utils/truncateText.js";
import {buildNpmGlobalUpdateCommand} from "./buildNpmGlobalUpdateCommand.js";
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

    function getLog() {
        return services.getLogger('update-check');
    }

    function getSource() {
        return chooseUpdateSource(services);
    }

    function getUpdateConfig() {
        return services.getConfig().updateCheck || {};
    }

    function getInstallCommand() {
        const source = getSource();
        const inferredCommand = String(source.getInstallCommand?.() || '').trim();
        const npmFallbackCommand = buildNpmGlobalUpdateCommand(getUpdateConfig().packageName);
        return String(getUpdateConfig().installCommand || '').trim() || inferredCommand || npmFallbackCommand;
    }

    function publishState(type = PUBSUB_EVENT_UPDATE_CHECK) {
        if (typeof services.getEvents !== 'function') {
            return;
        }

        services.getEvents().publishState(PUBSUB_SERVICE_UPDATE_MANAGER, {
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
            publishState(PUBSUB_EVENT_UPDATE_CHECK);
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
            getLog().error({err: _error}, 'Update check: error');
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

    async function installUpdate() {
        const installCommand = getInstallCommand();
        lastInstallCommand = installCommand;

        if (!installCommand) {
            return {
                ok: false,
                status: 'no-command',
                message: 'Aucune commande update disponible.',
            };
        }

        const timeoutMs = Math.max(10_000, Number(getUpdateConfig().installTimeoutSec || 0) * 1000);
        getLog().info({timeoutMs, installCommand}, 'Exécution commande install update');
        const result = await execShell(installCommand, timeoutMs);
        if (result.ok) {
            getLog().info('Install update terminée avec succès');
            return {
                ok: true,
                status: 'completed',
                message: 'Installation terminee.',
            };
        }

        const details = truncateText(result.stderr || result.stdout || 'Erreur inconnue');
        getLog().error({details}, 'Install update en échec');
        return {
            ok: false,
            status: 'failed',
            message: `Echec installation: ${details}`,
            details,
        };
    }

    return {
        runNow: () => checkOnce(),
        getInstallCommand: () => lastInstallCommand || getInstallCommand(),
        update: () => installUpdate(),
        check: () => checkOnce(),
        publishState,
    }
}
