import {createLogger} from '../../application/logger.js';
import {PUBSUB_EVENT_SOCKET_CLIENT_DISCONNECTED, PUBSUB_SERVICE_SOCKET} from '../../services/pubsub/serviceEventConstants.js';

let log;
function getModuleLog() { log ??= createLogger('socket'); return log; }

export function registerConnection(socket, events) {
  const eventLog = getModuleLog();
  socket.on('disconnect', () => {
    eventLog.info({socketId: socket.id}, 'Client disconnected');
    events.publishEvent(PUBSUB_SERVICE_SOCKET, PUBSUB_EVENT_SOCKET_CLIENT_DISCONNECTED, {clientId: socket.id});
  });
}
