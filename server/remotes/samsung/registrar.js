import {createLogger} from "../../services/log/logger.js";
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

const getLogger = () => createLogger('samsung:remote');

export function createSamsungRegistrar({samsung}) {
    return socket => {
        const client = socket.id.slice(0, 8);

        socket.on(REMOTE_EVENT_SAMSUNG_ON, async () => {
            getLogger().info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_ON}`);
            await samsung.turnOn();
        });

        socket.on(REMOTE_EVENT_SAMSUNG_OFF, async () => {
            getLogger().info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_OFF}`);
            await samsung.turnOff();
        });

        socket.on(REMOTE_EVENT_SAMSUNG_VOL_UP, async () => {
            getLogger().info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_VOL_UP}`);
            await samsung.volumeUp();
        });

        socket.on(REMOTE_EVENT_SAMSUNG_VOL_DOWN, async () => {
            getLogger().info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_VOL_DOWN}`);
            await samsung.volumeDown();
        });

        socket.on(REMOTE_EVENT_SAMSUNG_MUTE, async () => {
            getLogger().info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_MUTE}`);
            await samsung.mute();
        });

        socket.on(REMOTE_EVENT_SAMSUNG_INPUT, async () => {
            getLogger().info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_INPUT}`);
            await samsung.switchInput();
        });

        socket.on(REMOTE_EVENT_SAMSUNG_ENTER, async () => {
            getLogger().info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_ENTER}`);
            await samsung.confirm();
        });

        socket.on(REMOTE_EVENT_SAMSUNG_PC_INPUT, async () => {
            getLogger().info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_PC_INPUT}`);
            await samsung.switchToPcInput();
        });
    }
}
