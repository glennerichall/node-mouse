import {createServicesRegistry} from './services/createServicesRegistry.js';
import {
    bootstrapLogger,
} from './services/log/logger.js';
import {createApplicationLifecycle} from './application/createApplicationLifecycle.js';

export async function startServer() {
    const services = await createServicesRegistry();
    bootstrapLogger(services.getConfig);
    const lifecycle = createApplicationLifecycle(services);
    return lifecycle.start();
}
