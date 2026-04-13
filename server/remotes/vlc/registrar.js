import { createLogger } from '../../application/logger.js';
import {
  REMOTE_EVENT_VLC_COMMAND,
  REMOTE_EVENT_VLC_OPEN,
  REMOTE_EVENT_VLC_WINDOW_CLOSE,
  REMOTE_EVENT_VLC_WINDOW_TOGGLE,
} from '../../../utils/shared/remoteCommands.js';

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

export function createVlcRegistrar({ vlc, keyboard, getConfig = () => ({}) }) {
  const log = getModuleLog();
  return (socket) => {
    const client = socket.id.slice(0, 8);

    async function ensureUsable() {
      if (!(await vlc.isAvailable())) {
        log.info({ client }, 'VLC ignore: non disponible sur le host.');
        return false;
      }
      if (!isVlcEnabled(getConfig())) {
        log.info({ client }, 'VLC ignore: desactive par configuration.');
        return false;
      }
      return true;
    }

    socket.on(REMOTE_EVENT_VLC_OPEN, async () => {
      if (!(await ensureUsable())) {
        return;
      }

      log.info({ client }, `Demande ${REMOTE_EVENT_VLC_OPEN}`);
      await vlc.focusOrLaunch();
    });

    socket.on(REMOTE_EVENT_VLC_COMMAND, async (payload = {}) => {
      if (!(await ensureUsable())) {
        return;
      }

      const action = typeof payload?.action === 'string' ? payload.action : '';
      const command = VLC_ACTIONS[action];
      if (!command) {
        return;
      }

      log.info({ client, action }, `Demande ${REMOTE_EVENT_VLC_COMMAND}`);
      const focused = await vlc.focusOrLaunch();
      if (!focused) {
        return;
      }
      await keyboard.pressSpecialKey(command.key, command.modifiers);
    });

    socket.on(REMOTE_EVENT_VLC_WINDOW_TOGGLE, async () => {
      if (!(await ensureUsable())) {
        return;
      }

      log.info({ client }, `Demande ${REMOTE_EVENT_VLC_WINDOW_TOGGLE}`);
      await vlc.toggleWindow();
    });

    socket.on(REMOTE_EVENT_VLC_WINDOW_CLOSE, async () => {
      if (!(await ensureUsable())) {
        return;
      }

      log.info({ client }, `Demande ${REMOTE_EVENT_VLC_WINDOW_CLOSE}`);
      await vlc.closeWindow();
    });
  };
}
