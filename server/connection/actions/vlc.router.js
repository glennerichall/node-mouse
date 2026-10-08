import {createLogger} from '../../application/logger.js';
import {
    REMOTE_EVENT_VLC_COMMAND,
    REMOTE_EVENT_VLC_OPEN,
    REMOTE_EVENT_VLC_WINDOW_CLOSE,
    REMOTE_EVENT_VLC_WINDOW_TOGGLE
} from '../../../utils/remoteCommands.js';
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
export const ensureVlcUsable = async (request, _response, next) => {
    const vlc = getVlc(request);
    const getConfig = request.services.getConfig;
    if (!(await vlc.isAvailable())) {
        eventLog.info({client: getClientLabel(request.socket)}, 'VLC ignored: unavailable on host.');
        next('route');
        return;
    }
    if (!isVlcEnabled(getConfig())) {
        eventLog.info({client: getClientLabel(request.socket)}, 'VLC ignored: disabled by configuration.');
        next('route');
        return;
    }
    next();
};
vlcRouter
    .post(`/open`, ensureVlcUsable, async (request, _response, next) => {
        await getVlc(request).focusOrLaunch();
        next();
    })
    .post(`/command`, ensureVlcUsable, async (request, _response, next) => {
        const vlc = getVlc(request);
        const command = VLC_ACTIONS[request.body?.action];
        const keyboard = request.services.getInputController().keyboard;
        if (command && await vlc.focusOrLaunch()) await keyboard.pressSpecialKey(command.key, command.modifiers);
        next();
    })
    .post(`/window-toggle`, ensureVlcUsable, async (request, _response, next) => {
        await getVlc(request).toggleWindow();
        next();
    })
    .post(`/window-close`, ensureVlcUsable, async (request, _response, next) => {
        await getVlc(request).closeWindow();
        next();
    });
