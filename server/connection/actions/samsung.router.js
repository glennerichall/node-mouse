import {createLogger} from '../../application/logger.js';
import {getClientLabel} from '../client-channel.js';
import Router from 'router';

const log = createLogger('samsung:remote');

export const samsungRouter = Router()
    .post(`/on`, async (request, response) => {
        log.info({client: getClientLabel(request.socket)}, `Demande on`);
        await request.services.getRemotes().samsung.turnOn();
        response.send({ok: true});
    })
    
    .post(`/off`, async (request, response) => {
        log.info({client: getClientLabel(request.socket)}, `Demande off`);
        await request.services.getRemotes().samsung.turnOff();
        response.send({ok: true});
    })

    .post(`/volup`, async (request, response) => {
        log.info({client: getClientLabel(request.socket)}, `Demande volup`);
        await request.services.getRemotes().samsung.volumeUp();
        response.send({ok: true});
    })

    .post(`/voldown`, async (request, response) => {
        log.info({client: getClientLabel(request.socket)}, `Demande voldown`);
        await request.services.getRemotes().samsung.volumeDown();
        response.send({ok: true});
    })

    .post(`/mute`, async (request, response) => {
        log.info({client: getClientLabel(request.socket)}, `Demande mute`);
        await request.services.getRemotes().samsung.mute();
        response.send({ok: true});
    })

    .post(`/input`, async (request, response) => {
        log.info({client: getClientLabel(request.socket)}, `Demande input`);
        await request.services.getRemotes().samsung.switchInput();
        response.send({ok: true});
    })

    .post(`/enter`, async (request, response) => {
        log.info({client: getClientLabel(request.socket)}, `Demande enter`);
        await request.services.getRemotes().samsung.confirm();
        response.send({ok: true});
    })

    .post(`/pc-input`, async (request, response) => {
        log.info({client: getClientLabel(request.socket)}, `Demande pc-input`);
        await request.services.getRemotes().samsung.switchToPcInput();
        response.send({ok: true});
    });
