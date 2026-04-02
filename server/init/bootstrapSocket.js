import {createSocketSessionAuthMiddleware} from '../connection/socket/createSocketSessionAuthMiddleware.js';
import {createSocketActionRegistrars} from './createSocketActionRegistrars.js';
import {socketTimestampGuardMiddleware} from "../connection/socket/socket.timestamp-middleware.js";
import {NOTIFIER_LEVEL_INFO} from "../services/notifier/createNotifierComposite.js";

function broadcast(...functions) {
    return (...args) => functions.flatMap(f => f).map(f => f(...args));
}

function createNotificationHandler(services) {
    const notifier = services.getNotifier();
    const log = services.getLogger('socket:timestamp');

    return socket => {
        log.info({socketId: socket.id}, 'Client connecté');
        notifier.target().notify({
            level: NOTIFIER_LEVEL_INFO,
            title: 'Client connecte',
            message: `Client ${socket.id.slice(0, 8)} connecte.`,
        });
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
