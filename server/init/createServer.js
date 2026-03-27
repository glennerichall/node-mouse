import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import express from 'express';
import {
    ENTRY_PATH_ENABLED,
    ENTRY_PATH_FIXED,
    ENTRY_PATH_GRACE_MIN,
    ENTRY_PATH_ROTATE_INTERVAL_MIN,
    ENTRY_PATH_STATE_FILE,
    ENTRY_PATH_TOKEN_LENGTH,
    HTTPS_ENABLED,
    PORT,
    SERVER_HOST,
    SSL_CERT_PATH,
    SSL_KEY_PATH,
} from './config.js';
import {Server} from "socket.io";
import {createTokenManager} from "../connection/tokenManager.js";
import {getPublicUrl} from "../../utils/server/network.js";
import {loadRobot} from "../../utils/server/robot.js";
import {createNotifier} from "../notifier/notifier.js";

function createHttpsServer(app) {
    if (!SSL_KEY_PATH || !SSL_CERT_PATH) {
        throw new Error('HTTPS=true exige SSL_KEY_PATH et SSL_CERT_PATH.');
    }

    const key = fs.readFileSync(SSL_KEY_PATH, 'utf8');
    const cert = fs.readFileSync(SSL_CERT_PATH, 'utf8');
    return https.createServer({key, cert}, app);
}

export async function createServer(instances) {
    const app = express();
    
    const server = HTTPS_ENABLED
        ? createHttpsServer(app)
        : http.createServer(app);
    
    const io = new Server(server, {});

    const tokenManager = createTokenManager({
        enabled: ENTRY_PATH_ENABLED,
        fixedPath: ENTRY_PATH_FIXED,
        tokenLength: ENTRY_PATH_TOKEN_LENGTH,
        rotateIntervalMin: ENTRY_PATH_ROTATE_INTERVAL_MIN,
        graceMin: ENTRY_PATH_GRACE_MIN,
        stateFilePath: ENTRY_PATH_STATE_FILE,
    });

    const protocol = HTTPS_ENABLED ? 'https' : 'http';
    const basePublicUrl = getPublicUrl(PORT, protocol, SERVER_HOST);
    
    let robot = await loadRobot();
    
    const notifier = createNotifier(io);
    
    return {
        ...instances,
        app,
        server,
        io,
        tokenManager,
        basePublicUrl,
        robot,
        notifier
    };
}
