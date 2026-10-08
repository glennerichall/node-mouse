import {createLogger} from '../../application/logger.js';
import {getClientLabel} from '../client-channel.js';
import Router from 'router';

const log = createLogger('samsung:remote');

export const samsungRouter = Router()
    .patch('/power', async (request, response) => {
        const state = request.body?.state;
        log.info({client: getClientLabel(request.socket), state}, `Demande power`);
        if (state === 'off') await request.services.getRemotes().samsung.turnOff();
        else await request.services.getRemotes().samsung.turnOn();
        response.send({ok: true});
    })
    .post('/volume', async (request, response) => {
        const direction = request.body?.direction;
        log.info({client: getClientLabel(request.socket), direction}, `Demande volume`);
        if (direction === 'down') await request.services.getRemotes().samsung.volumeDown();
        else await request.services.getRemotes().samsung.volumeUp();
        response.send({ok: true});
    })
    .post('/audio', async (request, response) => {
        log.info({client: getClientLabel(request.socket)}, `Demande audio`);
        await request.services.getRemotes().samsung.mute();
        response.send({ok: true});
    })

    .post('/keys', async (request, response) => {
        log.info({client: getClientLabel(request.socket)}, `Demande keys`);
        await request.services.getRemotes().samsung.confirm();
        response.send({ok: true});
    })
    .post('/input', async (request, response) => {
        const source = request.body?.source;
        log.info({client: getClientLabel(request.socket), source}, `Demande input`);
        if (source === 'pc') await request.services.getRemotes().samsung.switchToPcInput();
        else await request.services.getRemotes().samsung.switchInput();
        response.send({ok: true});
    });
