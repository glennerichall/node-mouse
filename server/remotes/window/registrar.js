import { createLogger } from '../../application/logger.js';
import {
  REMOTE_EVENT_WINDOW_CLOSE,
  REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE,
} from '../../../utils/shared/remoteCommands.js';

let log;
function getModuleLog() {
  log ??= createLogger('window:remote');
  return log;
}

export function createWindowRegistrar({ windowActions }) {
  const log = getModuleLog();
  return (socket) => {
    const client = socket.id.slice(0, 8);

    socket.on(REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE, async () => {
      log.info({ client }, `Demande ${REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE}`);
      await windowActions.toggleMaximizeMinimize();
    });

    socket.on(REMOTE_EVENT_WINDOW_CLOSE, async () => {
      log.info({ client }, `Demande ${REMOTE_EVENT_WINDOW_CLOSE}`);
      await windowActions.closeActiveWindow();
    });
  };
}
