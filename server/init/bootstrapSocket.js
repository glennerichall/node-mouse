import {createSocketSessionAuthMiddleware} from '../connection/socket/createSocketSessionAuthMiddleware.js';
import {createSocketActionRegistrars} from './createSocketActionRegistrars.js';
import {socketTimestampGuardMiddleware} from "../connection/socket/socket.timestamp-middleware.js";
import { hasRecentRestart } from '../remotes/admin/notifyIfRestarted.js';
import {
    PUBSUB_EVENT_SOCKET_CLIENT_CONNECTED,
    PUBSUB_SERVICE_SOCKET
} from "../services/pubsub/serviceEventConstants.js";
import { REMOTE_EVENT_SYSTEM_RELOAD } from '../../utils/shared/remoteCommands.js';

function broadcast(...functions) {
    return (...args) => functions.flatMap(f => f).map(f => f(...args));
}

function createNotificationHandler(services) {
    const events = services.getEvents();
    const log = services.getLogger('socket:timestamp');

    return socket => {
        log.info({socketId: socket.id}, 'Client connecté');
        events.publishEvent(PUBSUB_SERVICE_SOCKET, PUBSUB_EVENT_SOCKET_CLIENT_CONNECTED, {
            clientId: socket.id,
        });
        if (hasRecentRestart()) {
            socket.emit(REMOTE_EVENT_SYSTEM_RELOAD, {
                reason: 'service-restarted',
            });
        }
    }
}

function createSocketGuardMiddleware(services) {
    const {
        getSystemConfig,
    } = services;

    const maxEventAgeMs = getSystemConfig().session.socketEventMaxAgeMs;

    return (socket, next) => {
        socket.use(socketTimestampGuardMiddleware({
            maxEventAgeMs,
            socketId: socket.id,
        }));
        
        // ... other guards here
        
        next();
    }
}

function createActionHandlers(services) {
    const socketActionRegistrars = createSocketActionRegistrars(services);
    return socket => {
        for (let register of socketActionRegistrars) {
            register(socket);
        }
    };
}

export function bootstrapSocket(services) {
    const {getServer} = services;

    const {io, cookieParser} = getServer();

    io.engine.use((...args) => cookieParser(...args));
    
    io.use(createSocketSessionAuthMiddleware(services));
    io.use(createSocketGuardMiddleware(services));

    io.on('connection', broadcast(
        createNotificationHandler(services),
        createActionHandlers(services)
    ));
}
