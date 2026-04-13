import {createLazy} from "../../utils/createLazy.js";
import {getSystemConfig} from "../services/config/index.js";
import {createPersistence} from "../services/persistence/index.js";
import {createApplicationDaemonService} from "../services/application/createApplicationDaemonService.js";
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

    return {
        ok: false,
        message: `Commande inconnue: ${formatCliCommand(command)}`,
    };
}