import {createLogger} from "./log/logger.js";
import {createLazy} from "../../utils/shared/createLazy.js";

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
                                                  createOsService,
                                                  createConfigService,
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
    let robotReady = false;
    let robotInstance;
    let qrOverlayReady = false;
    let qrOverlayInstance;

    let container = {
        // Lazy providers
        getSystemConfig: createLazy(() => createSystemConfig(container)),
        getPersistence: createLazy(() => createPersistence(container)),
        getOs: createLazy(() => createOsService(container)),
        getConfigService: createLazy(() => createConfigService(container)),
        getConfig: () => container.getConfigService().getConfigs(),
        getSseService: createLazy(() => createSseService(container)),
        getEventStore: createLazy(() => createEventStore(container)),
        getEvents: createLazy(() => createServiceEvents(container)),
        getTokenManager: createLazy(() => createTokenManager(container)),
        getNotifier: createLazy(() => createNotifier(container)),
        getPubSub: createLazy(() => createPubSub(container)),
        getTaskRunner: createLazy(() => createTaskRunner(container)),
        getTaskManager: createLazy(() => createTaskManager(container)),
        getServer: createLazy(() => createServer(container)),
        getQrOverlay: () => {
            if (!qrOverlayReady) {
                throw new Error('QR overlay service accessed before initialization');
            }
            return qrOverlayInstance;
        },
        getUpdateManager: createLazy(() => createUpdateManager(container)),
        getApplicationDaemonService: createLazy(() => createApplicationDaemonService(container)),
        getUrls: () => urlFactory(container),
        getLogger: scope => loggerFactory(container)(scope),
        getInputController: createLazy(() => createInputController(container)),
        getRemotes: createLazy(() => createRemotes(container)),
        getRobot: () => {
            if (!robotReady) {
                throw new Error('Robot service accessed before initialization');
            }
            return robotInstance;
        },
        async initializeCoreServices() {
            if (!robotReady) {
                robotInstance = await createRobot(container);
                robotReady = true;
            }

            if (!qrOverlayReady) {
                qrOverlayInstance = await createQrOverlay(container);
                qrOverlayReady = true;
            }

            return container;
        },

    };

    return container;
}
