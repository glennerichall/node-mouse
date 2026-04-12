import {createServicesRegistry} from './services/createServicesRegistry.js';
import {
    bootstrapLogger,
} from './application/logger.js';
import {createApplicationLifecycle} from './application/createApplicationLifecycle.js';

export async function startServer() {
    const services = await createServicesRegistry();
    await services.initializeCoreServices();
    bootstrapLogger(services.getConfig);
    const lifecycle = createApplicationLifecycle(services);
    return lifecycle.start();
}
