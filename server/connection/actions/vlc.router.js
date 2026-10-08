import {createLogger} from '../../application/logger.js';
import {getClientLabel} from '../client-channel.js';
import Router from 'router';

let log;

function getModuleLog() {
    log ??= createLogger('vlc:remote');
    return log;
}

const VLC_ACTIONS = {
    previous: {key: 'p'}, 'play-pause': {key: 'space'}, next: {key: 'n'}, 'seek-backward': {key: 'left'},
    stop: {key: 's'}, 'seek-forward': {key: 'right'}, 'volume-down': {key: 'down', modifiers: ['control']},
    mute: {key: 'm'}, 'volume-up': {key: 'up', modifiers: ['control']}, fullscreen: {key: 'f'},
};

function isVlcEnabled(config) {
    return config?.vlc?.enabled !== false;
}

const eventLog = getModuleLog();
const getVlc = (request) => request.services.getRemotes().vlc;
export const ensureVlcUsable = async (request, response, next) => {
    const vlc = getVlc(request);
    const getConfig = request.services.getConfig;
    if (!(await vlc.isAvailable())) {
        eventLog.info({client: getClientLabel(request.socket)}, 'VLC ignored: unavailable on host.');
        response.send({ok: false, ignored: true});
        return;
    }
    if (!isVlcEnabled(getConfig())) {
        eventLog.info({client: getClientLabel(request.socket)}, 'VLC ignored: disabled by configuration.');
        response.send({ok: false, ignored: true});
        return;
    }
    next();
};
export const vlcRouter = Router()
    .use(ensureVlcUsable)
    .post(`/window`, async (request, response) => {
        const opened = await getVlc(request).focusOrLaunch();
        response.status(opened === false ? 409 : 201).send({ok: opened !== false});
    })
    .post(`/commands`, async (request, response) => {
        const vlc = getVlc(request);
        const command = VLC_ACTIONS[request.body?.action];
        const keyboard = request.services.getInputController().keyboard;
        if (command && await vlc.focusOrLaunch()) await keyboard.pressSpecialKey(command.key, command.modifiers);
        response.status(204).end();
    })
    .patch(`/window`, async (request, response) => {
        await getVlc(request).toggleWindow();
        response.status(204).end();
    })
    .delete(`/window`, async (request, response) => {
        await getVlc(request).closeWindow();
        response.status(204).end();
    });
