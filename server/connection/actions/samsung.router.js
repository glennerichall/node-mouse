import {createLogger} from '../../application/logger.js';
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
import Router from 'router';

const log = createLogger('samsung:remote');

export const samsungRouter = Router()
    .post(`/${REMOTE_EVENT_SAMSUNG_ON}`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande ${REMOTE_EVENT_SAMSUNG_ON}`);
        await request.services.getRemotes().samsung.turnOn();
        next();
    })
    
    .post(`/${REMOTE_EVENT_SAMSUNG_OFF}`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande ${REMOTE_EVENT_SAMSUNG_OFF}`);
        await request.services.getRemotes().samsung.turnOff();
        next();
    })

    .post(`/${REMOTE_EVENT_SAMSUNG_VOL_UP}`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande ${REMOTE_EVENT_SAMSUNG_VOL_UP}`);
        await request.services.getRemotes().samsung.volumeUp();
        next();
    })

    .post(`/${REMOTE_EVENT_SAMSUNG_VOL_DOWN}`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande ${REMOTE_EVENT_SAMSUNG_VOL_DOWN}`);
        await request.services.getRemotes().samsung.volumeDown();
        next();
    })

    .post(`/${REMOTE_EVENT_SAMSUNG_MUTE}`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande ${REMOTE_EVENT_SAMSUNG_MUTE}`);
        await request.services.getRemotes().samsung.mute();
        next();
    })

    .post(`/${REMOTE_EVENT_SAMSUNG_INPUT}`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande ${REMOTE_EVENT_SAMSUNG_INPUT}`);
        await request.services.getRemotes().samsung.switchInput();
        next();
    })

    .post(`/${REMOTE_EVENT_SAMSUNG_ENTER}`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande ${REMOTE_EVENT_SAMSUNG_ENTER}`);
        await request.services.getRemotes().samsung.confirm();
        next();
    })

    .post(`/${REMOTE_EVENT_SAMSUNG_PC_INPUT}`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande ${REMOTE_EVENT_SAMSUNG_PC_INPUT}`);
        await request.services.getRemotes().samsung.switchToPcInput();
        next();
    });
