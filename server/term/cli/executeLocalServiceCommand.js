import path from 'node:path';
import {createLazy} from "../../../utils/createLazy.js";
import {getSystemConfig} from "../../services/config/index.js";
import {createPersistence} from "../../services/persistence/index.js";
import {createApplicationDaemonService} from "../../services/application/createApplicationDaemonService.js";
import {CONFIG_DIR} from '../../services/config/bootstrapConfig.js';
import {rollbackVerifiedNpmPackage} from '../../services/update-manager/installVerifiedNpmPackage.js';
import {formatCliCommand} from "./parseCliArgs.js";

function createLocalDaemonServices() {
    const services = {};
    services.getSystemConfig = createLazy(() => getSystemConfig());
    services.getPersistence = createLazy(() => createPersistence(services));
    services.getApplicationDaemonService = createLazy(() => createApplicationDaemonService(services));
    return services;
}

export async function executeLocalServiceCommand(command) {
    const services = createLocalDaemonServices();
    const action = String(command?.args?.action || '').trim();

    if (action === 'install') {
        return services.getApplicationDaemonService().install();
    }

    if (action === 'disable') {
        return services.getApplicationDaemonService().disable();
    }

    if (action === 'uninstall') {
        return services.getApplicationDaemonService().uninstall();
    }

    if (action === 'restart') {
        return services.getApplicationDaemonService().restart({
            cause: 'user',
            source: 'cli',
        });
    }

    if (action === 'rollback-update') {
        const packageName = String(services.getSystemConfig().updateCheck?.packageName || '').trim();
        const result = await rollbackVerifiedNpmPackage({
            packageName,
            rollbackDirectory: path.join(CONFIG_DIR, 'update-rollback'),
        });
        if (!result.ok) return result;

        const restart = await services.getApplicationDaemonService().restart({
            cause: 'update-rollback',
            source: 'cli',
        });
        if (!restart?.ok) {
            return {
                ok: false,
                rolledBack: true,
                message: `Package rolled back to ${result.version}, but service restart failed: ${restart?.message || 'unknown error'}`,
            };
        }
        return {...result, message: `Package rolled back to ${result.version}; service restart requested.`};
    }

    return {
        ok: false,
        message: `Commande inconnue: ${formatCliCommand(command)}`,
    };
}
