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
} from '../../../utils/remoteCommands.js';
import {getClientLabel} from '../client-channel.js';

let log = createLogger('samsung:remote');

export function createSamsungSubscriber({samsung}) {
    return function subscribeSamsung(channel) {
        const client = getClientLabel(channel);

        channel
            .on(REMOTE_EVENT_SAMSUNG_ON, async () => {
                log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_ON}`);
                await samsung.turnOn();
            })

            .on(REMOTE_EVENT_SAMSUNG_OFF, async () => {
                log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_OFF}`);
                await samsung.turnOff();
            })

            .on(REMOTE_EVENT_SAMSUNG_VOL_UP, async () => {
                log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_VOL_UP}`);
                await samsung.volumeUp();
            })

            .on(REMOTE_EVENT_SAMSUNG_VOL_DOWN, async () => {
                log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_VOL_DOWN}`);
                await samsung.volumeDown();
            })

            .on(REMOTE_EVENT_SAMSUNG_MUTE, async () => {
                log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_MUTE}`);
                await samsung.mute();
            })

            .on(REMOTE_EVENT_SAMSUNG_INPUT, async () => {
                log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_INPUT}`);
                await samsung.switchInput();
            })

            .on(REMOTE_EVENT_SAMSUNG_ENTER, async () => {
                log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_ENTER}`);
                await samsung.confirm();
            })

            .on(REMOTE_EVENT_SAMSUNG_PC_INPUT, async () => {
                log.info({client}, `Demande ${REMOTE_EVENT_SAMSUNG_PC_INPUT}`);
                await samsung.switchToPcInput();
            });
    }
}
