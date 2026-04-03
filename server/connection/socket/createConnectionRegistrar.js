import {createLogger} from "../../services/log/logger.js";
import {
    PUBSUB_EVENT_SOCKET_CLIENT_DISCONNECTED,
    PUBSUB_SERVICE_SOCKET
} from "../../services/pubsub/serviceEventConstants.js";

const log = createLogger('socket');

export function createConnectionRegistrar({events}) {
    return (socket) => {
        socket.on('disconnect', () => {
            log.info({socketId: socket.id}, 'Client déconnecté');
            events.publishEvent(PUBSUB_SERVICE_SOCKET, PUBSUB_EVENT_SOCKET_CLIENT_DISCONNECTED, {
                clientId: socket.id,
            });
        })
    }
}
