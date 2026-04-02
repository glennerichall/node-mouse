import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import express from 'express';
import {Server} from 'socket.io';
import {getPublicUrl} from '../../utils/network.js';
import cookieParser from "cookie-parser";

function createHttpsServer(app, config) {
    if (!config.https.sslKeyPath || !config.https.sslCertPath) {
        throw new Error('HTTPS=true exige SSL_KEY_PATH et SSL_CERT_PATH.');
    }

    const key = fs.readFileSync(config.https.sslKeyPath, 'utf8');
    const cert = fs.readFileSync(config.https.sslCertPath, 'utf8');
    return https.createServer({key, cert}, app);
}

export async function createServer(services) {
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

    const io = new Server(server, {});

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
        cookieParser: cookies
    };
}
    
