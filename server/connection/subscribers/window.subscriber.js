import { createLogger } from '../../application/logger.js';
import {
  REMOTE_EVENT_WINDOW_CLOSE,
  REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE,
} from '../../../utils/remoteCommands.js';
import {getClientLabel} from '../client-channel.js';

let log;
function getModuleLog() {
  log ??= createLogger('window:remote');
  return log;
}

export function createWindowSubscriber({ windowActions }) {
  const log = getModuleLog();
  return function subscribeWindow(channel) {
    const client = getClientLabel(channel);

    channel.on(REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE, async () => {
      log.info({ client }, `Demande ${REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE}`);
      await windowActions.toggleMaximizeMinimize();
    });

    channel.on(REMOTE_EVENT_WINDOW_CLOSE, async () => {
      log.info({ client }, `Demande ${REMOTE_EVENT_WINDOW_CLOSE}`);
      await windowActions.closeActiveWindow();
    });
  };
}
