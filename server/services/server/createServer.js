import http from 'node:http';
import express from 'express';
import {Server} from 'socket.io';
import {getPublicUrl} from '../../utils/network.js';
import cookieParser from "cookie-parser";
import {createHttpsServer} from "./createHttpsServer.js";

export function createServer(services) {
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

    server.on('connection', (socket) => {
        sockets.add(socket);
        socket.on('close', () => {
            sockets.delete(socket);
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
            server.closeIdleConnections?.();
        },
        destroyConnections: () => {
            for (const socket of sockets) {
                socket.destroy();
            }
            sockets.clear();
        }
    };
}
    
