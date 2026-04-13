import {createLazy} from "../../utils/createLazy.js";
import {createLogger} from '../application/logger.js';

const log = createLogger('services:container');

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
        qrUrl: `${publicBaseUrl}/qr`,
        adminConfigUrl: `${publicBaseUrl}/ui/admin/config`,
        serverInfoUrl: `${publicBaseUrl}/ui/admin/server-info`,
        healthUrl: `${publicBaseUrl}/health`,
    }
}

export async function createServicesContainer({
                                                  createSystemConfig,
                                                  createPersistence,
                                                  createOsService,
                                                  createSystemService,
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
    let robotInstance;
    let qrOverlayInstance;

    let container = {
        // Lazy providers
        getSystemConfig: createLazy(() => createSystemConfig(container)),
        getPersistence: createLazy(() => createPersistence(container)),
        getOs: createLazy(() => createOsService(container)),
        getSystem: createLazy(() => createSystemService(container)),
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
        getQrOverlay: () => qrOverlayInstance,
        getUpdateManager: createLazy(() => createUpdateManager(container)),
        getApplicationDaemonService: createLazy(() => createApplicationDaemonService(container)),
        getUrls: () => urlFactory(container),
        getInputController: createLazy(() => createInputController(container)),
        getRemotes: createLazy(() => createRemotes(container)),
        getRobot: () => robotInstance,

    };

    log.debug('Initialisation service robot');
    robotInstance = await createRobot(container);
    log.debug('Service robot initialise');

    log.debug('Initialisation service QR overlay');
    qrOverlayInstance = await createQrOverlay(container);
    log.debug('Service QR overlay initialise');

    return container;
}
