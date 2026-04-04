import {createPersistence} from './persistence/index.js';
import {createServicesContainer,} from './createServicesContainer.js';
import {loadRobot} from '../utils/robot.js';
import {createServer} from "./server/createServer.js";
import {createInputController} from "./input/createInputController.js";
import {getSystemConfig} from "./config/index.js";
import {createConfig} from "./config/configService.js";
import {createTokenManager} from "./token-manager/createTokenManager.js";
import {createNotifier} from "./notifier/createNotifier.js";
import {createTaskRunner} from './task-runner/createTaskRunner.js';
import {createTaskManager} from './task-manager/createTaskManager.js';
import {createUpdateManager} from "./update-manager/createUpdateManager.js";
import {startQrOverlay} from "./overlay/qr-overlay.js";
import {createRemotes} from "./remotes/createRemotes.js";
import {createPubSub} from './pubsub/createPubSub.js';
import {createEventStore} from './pubsub/createEventStore.js';
import {createServiceEvents} from './pubsub/createServiceEvents.js';
import {createSseService} from './sse/createSseService.js';

export function qrOverlayFactory(services) {
    return startQrOverlay({
        getUrl: () => services.getUrls().entryUrl,
        robot: services.getRobot(),
        getConfig: () => services.getConfig(),
        getSystemConfig: () => services.getSystemConfig(),
    });
}

export function createServicesRegistry() {

    return createServicesContainer({
        createSystemConfig: getSystemConfig,
        createPersistence,
        createConfig,
        createSseService,
        createEventStore,
        createServiceEvents,
        createTokenManager,
        createRobot: loadRobot,
        createNotifier,
        createPubSub,
        createTaskRunner,
        createTaskManager,
        createQrOverlay: qrOverlayFactory,
        createUpdateManager,
        createServer,
        createInputController,
        createRemotes
    });
}
