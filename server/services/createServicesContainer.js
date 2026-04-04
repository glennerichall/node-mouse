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
        getServer,
        getTokenManager
    } = services;

    const tokenManager = getTokenManager();
    const token = tokenManager.getToken() || tokenManager.createToken();

    return {
        entryUrl: `${getServer().basePublicUrl}/api/sessions/${token}`
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
