import {chooseUpdateCheckSource} from "./chooseUpdateCheckSource.js";
import {chooseUpdateInstallSource} from "./chooseUpdateInstallSource.js";
import {
    PUBSUB_EVENT_UPDATE_AVAILABLE,
    PUBSUB_EVENT_UPDATE_CHECK,
    PUBSUB_EVENT_UPDATE_ERROR,
    PUBSUB_SERVICE_UPDATE_MANAGER
} from "../pubsub/serviceEventConstants.js";
import {createLogger} from '../../application/logger.js';
import {packageJsonPath} from '../config/bootstrapConfig.js';
import {readPackageVersion} from '../../utils/env.js';

export function createUpdateManager(services) {
    const log = createLogger('update-check');
    let lastKey = '';
    let lastInstallCommand = '';
    let lastResult = null;
    let lastLatestVersion = '';

    function publishState(type = PUBSUB_EVENT_UPDATE_CHECK) {
        services.getEvents().publishState(PUBSUB_SERVICE_UPDATE_MANAGER, {
            enabled: Boolean(services.getConfig().updateCheck?.enabled),
            lastKey,
            lastInstallCommand,
            lastResult,
        }, {type});
    }

    async function check({force = false} = {}) {
        const updateCheckEnabled = Boolean(services.getConfig().updateCheck?.enabled);
        log.debug({ enabled: updateCheckEnabled, force, lastKey }, 'Update check: start');

        if (!updateCheckEnabled && !force) {
            log.debug('Update check: skipped because disabled');
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
            const runCheck = chooseUpdateCheckSource(services);
            log.debug('Update check: source resolved');
            const result = await runCheck();
            log.debug({ result }, 'Update check: source returned');
            const updateConfig = services.getSystemConfig().updateCheck || {};
            const currentVersion = result?.currentVersion || updateConfig.currentVersion || '(unknown)';
            const latestVersion = result?.latestVersion || '';
            lastLatestVersion = latestVersion;
            log.info({
                source: updateConfig.checkCommand ? 'command' : 'npm',
                packageName: updateConfig.packageName || '(unknown)',
                installedVersion: readPackageVersion(packageJsonPath),
                currentVersion,
                latestVersion: latestVersion || '(unknown)',
                updateAvailable: Boolean(result?.hasUpdate),
            }, 'Update check completed');

            if (!result?.hasUpdate || !result.key || (!force && result.key === lastKey)) {
                log.debug({
                    hasUpdate: Boolean(result?.hasUpdate),
                    key: result?.key || '',
                    duplicateKey: Boolean(result?.key && result.key === lastKey),
                }, 'Update check: no update');
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
            log.debug({ key: lastKey, ttlMs: result.ttlMs || 8000 }, 'Update check: update detected');
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
        const updateConfig = services.getSystemConfig().updateCheck || {};
        const versionFields = {
            packageName: updateConfig.packageName || '(unknown)',
            currentVersion: readPackageVersion(packageJsonPath),
            targetVersion: lastLatestVersion || '(unknown)',
        };
        log.debug({ installCommand: lastInstallCommand }, 'Install update: source resolved');
        log.info({...versionFields, installCommand: lastInstallCommand}, 'Executing update install command');
        const result = await install();
        log.debug({ result }, 'Install update: source returned');
        const installedVersion = readPackageVersion(packageJsonPath);
        if (result.ok) {
            log.info({...versionFields, installedVersion}, 'Update install completed successfully');
            return result;
        }
        if (result?.status === 'failed') {
            log.error({...versionFields, installedVersion, details: result.details}, 'Update install failed');
        }
        return result;
    }

    return {
        check,
        update,
    }
}
