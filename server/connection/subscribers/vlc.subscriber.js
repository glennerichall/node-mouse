import { createLogger } from '../../application/logger.js';
import {
  REMOTE_EVENT_VLC_COMMAND,
  REMOTE_EVENT_VLC_OPEN,
  REMOTE_EVENT_VLC_WINDOW_CLOSE,
  REMOTE_EVENT_VLC_WINDOW_TOGGLE,
} from '../../../utils/remoteCommands.js';
import {getClientLabel} from '../client-channel.js';

let log;
function getModuleLog() {
  log ??= createLogger('vlc:remote');
  return log;
}
const VLC_ACTIONS = {
  previous: { key: 'p' },
  'play-pause': { key: 'space' },
  next: { key: 'n' },
  'seek-backward': { key: 'left' },
  stop: { key: 's' },
  'seek-forward': { key: 'right' },
  'volume-down': { key: 'down', modifiers: ['control'] },
  mute: { key: 'm' },
  'volume-up': { key: 'up', modifiers: ['control'] },
  fullscreen: { key: 'f' },
};

function isVlcEnabled(config) {
  return config?.vlc?.enabled !== false;
}

export function createVlcSubscriber({ vlc, keyboard, getConfig = () => ({}) }) {
  const log = getModuleLog();
  return function subscribeVlc(channel) {
    const client = getClientLabel(channel);

    async function ensureUsable() {
      if (!(await vlc.isAvailable())) {
        log.info({ client }, 'VLC ignored: unavailable on host.');
        return false;
      }
      if (!isVlcEnabled(getConfig())) {
        log.info({ client }, 'VLC ignored: disabled by configuration.');
        return false;
      }
      return true;
    }

    channel.on(REMOTE_EVENT_VLC_OPEN, async () => {
      if (!(await ensureUsable())) {
        return;
      }

        log.info({ client }, `Request ${REMOTE_EVENT_VLC_OPEN}`);
      await vlc.focusOrLaunch();
    });

    channel.on(REMOTE_EVENT_VLC_COMMAND, async (payload = {}) => {
      if (!(await ensureUsable())) {
        return;
      }

      const action = typeof payload?.action === 'string' ? payload.action : '';
      const command = VLC_ACTIONS[action];
      if (!command) {
        return;
      }

        log.info({ client, action }, `Request ${REMOTE_EVENT_VLC_COMMAND}`);
      const focused = await vlc.focusOrLaunch();
      if (!focused) {
        return;
      }
      await keyboard.pressSpecialKey(command.key, command.modifiers);
    });

    channel.on(REMOTE_EVENT_VLC_WINDOW_TOGGLE, async () => {
      if (!(await ensureUsable())) {
        return;
      }

        log.info({ client }, `Request ${REMOTE_EVENT_VLC_WINDOW_TOGGLE}`);
      await vlc.toggleWindow();
    });

    channel.on(REMOTE_EVENT_VLC_WINDOW_CLOSE, async () => {
      if (!(await ensureUsable())) {
        return;
      }

        log.info({ client }, `Request ${REMOTE_EVENT_VLC_WINDOW_CLOSE}`);
      await vlc.closeWindow();
    });
  };
}
