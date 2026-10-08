import {createLogger} from "../../application/logger.js";
import {
    PUBSUB_EVENT_SOCKET_CLIENT_DISCONNECTED,
    PUBSUB_SERVICE_SOCKET
} from "../../services/pubsub/serviceEventConstants.js";

let log;
function getModuleLog() {
    log ??= createLogger('socket');
    return log;
}

export function createConnectionSubscriber({events}) {
    const log = getModuleLog();
    return function subscribeConnection(channel) {
        channel.on('disconnect', () => {
            log.info({socketId: channel.id}, 'Client disconnected');
            events.publishEvent(PUBSUB_SERVICE_SOCKET, PUBSUB_EVENT_SOCKET_CLIENT_DISCONNECTED, {
                clientId: channel.id,
            });
        })
    }
}
