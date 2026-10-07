import {hasRecentRestart} from '../../remotes/admin/notifyIfRestarted.js';
import {
  PUBSUB_EVENT_SOCKET_CLIENT_CONNECTED,
  PUBSUB_SERVICE_SOCKET,
} from '../../services/pubsub/serviceEventConstants.js';
import {REMOTE_EVENT_SYSTEM_RELOAD} from '../../../utils/remoteCommands.js';
import {createLogger} from '../../application/logger.js';

export function createSocketNotificationHandler(services) {
  const events = services.getEvents();
  const log = createLogger('socket:timestamp');

  return socket => {
    log.info({socketId: socket.id}, 'Client connected');
    events.publishEvent(PUBSUB_SERVICE_SOCKET, PUBSUB_EVENT_SOCKET_CLIENT_CONNECTED, {
      clientId: socket.id,
    });
    if (hasRecentRestart()) {
      socket.emit(REMOTE_EVENT_SYSTEM_RELOAD, {
        reason: 'service-restarted',
      });
    }
  };
}
