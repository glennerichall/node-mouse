import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import express from 'express';
import {Server} from 'socket.io';
import {createTokenManager} from '../connection/tokenManager.js';
import {getPublicUrl} from '../utils/network.js';
import {loadRobot} from '../utils/robot.js';
import {createNotifier} from '../notifier/notifier.js';

function createHttpsServer(app, config) {
    if (!config.https.sslKeyPath || !config.https.sslCertPath) {
        throw new Error('HTTPS=true exige SSL_KEY_PATH et SSL_CERT_PATH.');
    }

    const key = fs.readFileSync(config.https.sslKeyPath, 'utf8');
    const cert = fs.readFileSync(config.https.sslCertPath, 'utf8');
    return https.createServer({key, cert}, app);
}

export async function createServer(instances) {
    const {configService} = instances;
    const config = configService.get();
    const serverStartedAt = Date.now();
    const app = express();
    
    const server = config.https.enabled
        ? createHttpsServer(app, config)
        : http.createServer(app);
    
    const io = new Server(server, {});

    const tokenManager = createTokenManager({
        enabled: config.entryPath.enabled,
        fixedPath: config.entryPath.fixed,
        tokenLength: config.entryPath.tokenLength,
        rotateIntervalMin: config.entryPath.rotateMin,
        graceMin: config.entryPath.graceMin,
    });

    const basePublicUrl = getPublicUrl(
        config.port,
        config.protocol, 
        config.serverHost);
    
    let robot = await loadRobot();
    
    const notifier = createNotifier({ io, configService });
    
    return {
        ...instances,
        app,
        server,
        io,
        serverStartedAt,
        tokenManager,
        basePublicUrl,
        robot,
        notifier
    };
}
    