import {createLogger} from '../../application/logger.js';
import {getClientLabel} from '../client-channel.js';
import Router from 'router';

const log = createLogger('samsung:remote');

export const samsungRouter = Router()
    .post(`/on`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande on`);
        await request.services.getRemotes().samsung.turnOn();
        next();
    })
    
    .post(`/off`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande off`);
        await request.services.getRemotes().samsung.turnOff();
        next();
    })

    .post(`/volup`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande volup`);
        await request.services.getRemotes().samsung.volumeUp();
        next();
    })

    .post(`/voldown`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande voldown`);
        await request.services.getRemotes().samsung.volumeDown();
        next();
    })

    .post(`/mute`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande mute`);
        await request.services.getRemotes().samsung.mute();
        next();
    })

    .post(`/input`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande input`);
        await request.services.getRemotes().samsung.switchInput();
        next();
    })

    .post(`/enter`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande enter`);
        await request.services.getRemotes().samsung.confirm();
        next();
    })

    .post(`/pc-input`, async (request, _response, next) => {
        log.info({client: getClientLabel(request.socket)}, `Demande pc-input`);
        await request.services.getRemotes().samsung.switchToPcInput();
        next();
    });
