import {createLogger} from "./log/logger.js";

export function createLazy(provider) {
    let hasValue = false;
    let value;

    return () => {
        if (!hasValue) {
            value = provider();
            hasValue = true;
        }

        return value;
    };
}

async function resolveNow(asyncProvider) {
    const instance = await asyncProvider();
    return createLazy(() => instance);
}

function urlFactory(services) {
    const {
        getSystemConfig,
        getServer,
        getTokenManager
    } = services;

    const systemConfig = getSystemConfig();
    const protocol = String(systemConfig?.protocol || 'http');
    const port = Number(systemConfig?.port || 0);
    const publicBaseUrl = getServer().basePublicUrl;
    const localBaseUrl = `${protocol}://127.0.0.1:${port}`;
    const tokenManager = getTokenManager();
    const token = tokenManager.getToken() || tokenManager.createToken();
    const entryPath = `/api/sessions/${token}`;

    return {
        publicBaseUrl,
        localBaseUrl,
        entryUrl: `${publicBaseUrl}${entryPath}`,
        localEntryUrl: `${localBaseUrl}${entryPath}`,
        qrUrl: `${publicBaseUrl}/qr`,
        localQrUrl: `${localBaseUrl}/qr`,
        adminConfigUrl: `${publicBaseUrl}/ui/admin/config`,
        localAdminConfigUrl: `${localBaseUrl}/ui/admin/config`,
        serverInfoUrl: `${publicBaseUrl}/ui/admin/server-info`,
        localServerInfoUrl: `${localBaseUrl}/ui/admin/server-info`,
        healthUrl: `${publicBaseUrl}/health`,
        localHealthUrl: `${localBaseUrl}/health`,
    }
}

function loggerFactory(services) {
    return scope => createLogger(scope, services.getConfig);
}

export async function createServicesContainer({
                                                  createSystemConfig,
                                                  createPersistence,
                                                  createConfig,
                                                  createSseService,
                                                  createEventStore,
                                                  createServiceEvents,
                                                  createTokenManager,
                                                  createRobot,
                                                  createNotifier,
                                                  createPubSub,
                                                  createTaskRunner,
                                                  createTaskManager,
                                                  createQrOverlay,
                                                  createUpdateManager,
                                                  createApplicationDaemonService,
                                                  createServer,
                                                  createInputController,
                                                  createRemotes
                                              }) {

    let container = {
        // Lazy providers
        getSystemConfig: createLazy(() => createSystemConfig(container)),
        getPersistence: createLazy(() => createPersistence(container)),
        getConfig: () => createConfig(container),
        getSseService: createLazy(() => createSseService(container)),
        getEventStore: createLazy(() => createEventStore(container)),
        getEvents: createLazy(() => createServiceEvents(container)),
        getTokenManager: createLazy(() => createTokenManager(container)),
        getNotifier: createLazy(() => createNotifier(container)),
        getPubSub: createLazy(() => createPubSub(container)),
        getTaskRunner: createLazy(() => createTaskRunner(container)),
        getTaskManager: createLazy(() => createTaskManager(container)),
        getQrOverlay: createLazy(() => createQrOverlay(container)),
        getUpdateManager: createLazy(() => createUpdateManager(container)),
        getApplicationDaemonService: createLazy(() => createApplicationDaemonService(container)),
        getUrls: () => urlFactory(container),
        getLogger: scope => loggerFactory(container)(scope),
        getInputController: createLazy(() => createInputController(container)),
        getRemotes: createLazy(() => createRemotes(container)),

    };

    container.getRobot = await resolveNow(() => createRobot(container));
    container.getEventStore = await resolveNow(() => createEventStore(container));
    container.getServer = await resolveNow(() => createServer(container));
    container.getQrOverlay = await resolveNow(() => createQrOverlay(container));

    return container;
}
