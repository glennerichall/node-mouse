import http from 'node:http';
import express from 'express';
import {Server} from 'socket.io';
import {getPublicUrl} from '../../utils/network.js';
import cookieParser from "cookie-parser";
import {createHttpsServer} from "./createHttpsServer.js";
import {createLogger} from '../../application/logger.js';

export function createServer(services) {
    const log = createLogger('server:create');
    const {
        getSystemConfig
    } = services;

    const config = getSystemConfig();
    const serverStartedAt = Date.now();
    const app = express();
    const cookies = cookieParser(config.session.cookieSecret);

    const server = config.https.enabled
        ? createHttpsServer(app, config)
        : http.createServer(app);
    const sockets = new Set();

    const io = new Server(server, {});
    log.debug({
        protocol: config.protocol,
        port: config.port,
        httpsEnabled: Boolean(config.https.enabled),
    }, 'Serveur HTTP initialise');

    server.on('connection', (socket) => {
        sockets.add(socket);
        log.trace({socketCount: sockets.size}, 'Connexion HTTP ouverte');
        socket.on('close', () => {
            sockets.delete(socket);
            log.trace({socketCount: sockets.size}, 'Connexion HTTP fermee');
        });
    });

    const basePublicUrl = getPublicUrl(
        config.port,
        config.protocol,
        config.serverHost);

    return {
        server,
        io,
        app,
        basePublicUrl,
        serverStartedAt,
        cookieParser: cookies,
        closeIdleConnections: () => {
            log.debug('Fermeture connexions HTTP inactives');
            server.closeIdleConnections?.();
        },
        destroyConnections: () => {
            log.debug({socketCount: sockets.size}, 'Destruction connexions HTTP restantes');
            for (const socket of sockets) {
                socket.destroy();
            }
            sockets.clear();
        }
    };
}
    
