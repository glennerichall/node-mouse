import {createPersistence} from './persistence/index.js';
import {createServicesContainer,} from './createServicesContainer.js';
import {loadRobot} from '../utils/robot.js';
import {createServer} from "./server/createServer.js";
import {createInputController} from "./input/createInputController.js";
import {getSystemConfig} from "./config/index.js";
import {createConfig} from "./config/configService.js";
import {createTokenManager} from "./token-manager/createTokenManager.js";
import {createNotifier} from "./notifier/createNotifier.js";
import {createTaskManager} from './task-manager/createTaskManager.js';
import {createUpdateManager} from "./update-manager/createUpdateManager.js";
import {startQrOverlay} from "./overlay/qr-overlay.js";
import {createRemotes} from "./remotes/createRemotes.js";
import {createPubSub} from './pubsub/createPubSub.js';

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
        createTokenManager,
        createRobot: loadRobot,
        createNotifier,
        createPubSub,
        createTaskManager,
        createQrOverlay: qrOverlayFactory,
        createUpdateManager,
        createServer,
        createInputController,
        createRemotes
    });
}
