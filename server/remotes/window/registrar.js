import { createLogger } from '../../application/logger.js';
import {
  REMOTE_EVENT_WINDOW_CLOSE,
  REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE,
} from '../../../utils/shared/remoteCommands.js';

const getLogger = () => createLogger('window:remote');

export function createWindowRegistrar({ windowActions }) {
  return (socket) => {
    const client = socket.id.slice(0, 8);

    socket.on(REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE, async () => {
      getLogger().info({ client }, `Demande ${REMOTE_EVENT_WINDOW_TOGGLE_MAXIMIZE}`);
      await windowActions.toggleMaximizeMinimize();
    });

    socket.on(REMOTE_EVENT_WINDOW_CLOSE, async () => {
      getLogger().info({ client }, `Demande ${REMOTE_EVENT_WINDOW_CLOSE}`);
      await windowActions.closeActiveWindow();
    });
  };
}
