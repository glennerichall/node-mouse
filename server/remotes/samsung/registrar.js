import {createLogger} from "../../services/log/logger.js";

const log = createLogger('samsung:remote');

export function createSamsungRegistrar({samsung}) {
    return socket => {
        const client = socket.id.slice(0, 8);

        socket.on('samsung:on', async () => {
            log.info({client}, 'Demande samsung:on');
            await samsung.turnOn();
        });

        socket.on('samsung:off', async () => {
            log.info({client}, 'Demande samsung:off');
            await samsung.turnOff();
        });

        socket.on('samsung:volup', async () => {
            log.info({client}, 'Demande samsung:volup');
            await samsung.volumeUp();
        });

        socket.on('samsung:voldown', async () => {
            log.info({client}, 'Demande samsung:voldown');
            await samsung.volumeDown();
        });

        socket.on('samsung:input', async () => {
            log.info({client}, 'Demande samsung:input');
            await samsung.switchInput();
        });

        socket.on('samsung:enter', async () => {
            log.info({client}, 'Demande samsung:enter');
            await samsung.confirm();
        });

        socket.on('samsung:pc-input', async () => {
            log.info({client}, 'Demande samsung:pc-input');
            await samsung.switchToPcInput();
        });
    }
}
