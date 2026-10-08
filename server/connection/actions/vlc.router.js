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
export const vlcRouter = Router()
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
vlcRouter
    .post(`/open`, ensureVlcUsable, async (request, response) => {
        await getVlc(request).focusOrLaunch();
        response.send({ok: true});
    })
    .post(`/command`, ensureVlcUsable, async (request, response) => {
        const vlc = getVlc(request);
        const command = VLC_ACTIONS[request.body?.action];
        const keyboard = request.services.getInputController().keyboard;
        if (command && await vlc.focusOrLaunch()) await keyboard.pressSpecialKey(command.key, command.modifiers);
        response.send({ok: true});
    })
    .post(`/window-toggle`, ensureVlcUsable, async (request, response) => {
        await getVlc(request).toggleWindow();
        response.send({ok: true});
    })
    .post(`/window-close`, ensureVlcUsable, async (request, response) => {
        await getVlc(request).closeWindow();
        response.send({ok: true});
    });
