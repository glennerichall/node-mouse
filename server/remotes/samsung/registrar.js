import {createLogger} from "../../application/logger.js";
import {
    REMOTE_EVENT_SAMSUNG_ENTER,
    REMOTE_EVENT_SAMSUNG_INPUT,
    REMOTE_EVENT_SAMSUNG_MUTE,
    REMOTE_EVENT_SAMSUNG_OFF,
    REMOTE_EVENT_SAMSUNG_ON,
    REMOTE_EVENT_SAMSUNG_PC_INPUT,
    REMOTE_EVENT_SAMSUNG_VOL_DOWN,
    REMOTE_EVENT_SAMSUNG_VOL_UP,
} from '../../../utils/shared/remoteCommands.js';

let log;
function getModuleLog() {
    log ??= createLogger('samsung:remote');
    return log;
}

export function createSamsungRegistrar({samsung}) {
    const log = getModuleLog();
    return socket => {
        const client = socket.id.slice(0, 8);

        socket.on(REMOTE_EVENT_SAMSUNG_ON, async () => {
            log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_ON}`);
            await samsung.turnOn();
        });

        socket.on(REMOTE_EVENT_SAMSUNG_OFF, async () => {
            log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_OFF}`);
            await samsung.turnOff();
        });

        socket.on(REMOTE_EVENT_SAMSUNG_VOL_UP, async () => {
            log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_VOL_UP}`);
            await samsung.volumeUp();
        });

        socket.on(REMOTE_EVENT_SAMSUNG_VOL_DOWN, async () => {
            log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_VOL_DOWN}`);
            await samsung.volumeDown();
        });

        socket.on(REMOTE_EVENT_SAMSUNG_MUTE, async () => {
            log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_MUTE}`);
            await samsung.mute();
        });

        socket.on(REMOTE_EVENT_SAMSUNG_INPUT, async () => {
            log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_INPUT}`);
            await samsung.switchInput();
        });

        socket.on(REMOTE_EVENT_SAMSUNG_ENTER, async () => {
            log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_ENTER}`);
            await samsung.confirm();
        });

        socket.on(REMOTE_EVENT_SAMSUNG_PC_INPUT, async () => {
            log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_PC_INPUT}`);
            await samsung.switchToPcInput();
        });
    }
}
