import {createLogger} from '../application/logger.js';
import {broadcast} from '../connection/socket/broadcast.js';
import {createSocketActionHandlers} from '../connection/socket/createSocketActionHandlers.js';
import {createSocketGuards} from '../connection/socket/createSocketGuards.js';
import {createSocketNotificationHandler} from '../connection/socket/createSocketNotificationHandler.js';

export function bootstrapSocket(services) {
    const {getServer} = services;
    const log = createLogger('socket:bootstrap');

    const {io, cookieParser} = getServer();
    log.debug('Initializing Socket.IO');

    io.engine.use((...args) => cookieParser(...args));

    createSocketGuards(services).forEach(guard => {io.use(guard)});

    log.trace('Socket.IO middlewares registered');

    io.on('connection', broadcast(
        createSocketNotificationHandler(services),
        createSocketActionHandlers(services)
    ));
    log.debug('Socket.IO handlers registered');
}
