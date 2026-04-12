import {createLogger} from "../../application/logger.js";
import {
    PUBSUB_EVENT_SOCKET_CLIENT_DISCONNECTED,
    PUBSUB_SERVICE_SOCKET
} from "../../services/pubsub/serviceEventConstants.js";

const getLogger = () => createLogger('socket');

export function createConnectionRegistrar({events}) {
    return (socket) => {
        socket.on('disconnect', () => {
            getLogger().info({socketId: socket.id}, 'Client déconnecté');
            events.publishEvent(PUBSUB_SERVICE_SOCKET, PUBSUB_EVENT_SOCKET_CLIENT_DISCONNECTED, {
                clientId: socket.id,
            });
        })
    }
}
