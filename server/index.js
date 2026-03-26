import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import express from 'express';
import {Server} from 'socket.io';
import qrcodeTerminal from 'qrcode-terminal';
import QRCode from 'qrcode';
import {
    PORT,
    SERVER_HOST,
    HTTPS_ENABLED,
    SSL_KEY_PATH,
    SSL_CERT_PATH,
    PREVIEW_WIDTH,
    PREVIEW_HEIGHT,
    PREVIEW_FPS,
    ENTRY_PATH_ENABLED,
    ENTRY_PATH_FIXED,
    ENTRY_PATH_TOKEN_LENGTH,
    ENTRY_PATH_ROTATE_INTERVAL_MIN,
    ENTRY_PATH_GRACE_MIN,
    ENTRY_PATH_STATE_FILE,
    logStartupConfig,
} from './config.js';
import {
    publicDir,
    clientDir,
    utilsDir
} from '../utils/paths.js';
import {getPublicUrl} from '../utils/network.js';
import {createBrowserReceiver} from './browser/index.js';
import {createPreviewStreamer} from './preview/preview.js';
import {createNotifier} from './notifier/notifier.js';
import {startUpdateChecker} from './update-check/index.js';
import {startQrOverlay} from './overlay/qr-overlay.js';
import {createEntryTokenManager} from './connection/entry-token.js';
import {createApiRouter} from './connection/api.js';
import {registerSocketHandlers} from './connection/socket.js';
import {createControlEventRegister} from './connection/events/input.js';
import {createCommandEventRegister} from './connection/events/commands.js';
import {createAdminEventRegister} from './connection/events/admin.js';
import {createPreviewEventRegister} from './connection/events/preview.js';
import {
    createAdminActions,
    notifyIfRestarted
} from "./admin-actions/index.js";
import {createController} from "./controllers/controller.js";

export async function startServer() {
    const app = express();

    const server = HTTPS_ENABLED
        ? createHttpsServer(app)
        : http.createServer(app);

    const io = new Server(server);

    const notifier = createNotifier(io);

    const entryTokenManager = createEntryTokenManager({
        enabled: ENTRY_PATH_ENABLED,
        fixedPath: ENTRY_PATH_FIXED,
        tokenLength: ENTRY_PATH_TOKEN_LENGTH,
        rotateIntervalMin: ENTRY_PATH_ROTATE_INTERVAL_MIN,
        graceMin: ENTRY_PATH_GRACE_MIN,
        stateFilePath: ENTRY_PATH_STATE_FILE,
    });

    const {
        robot,
        mouse,
        keyboard
    } = await createController();

    const browser = createBrowserReceiver();

    const preview = createPreviewStreamer(robot, {
        width: PREVIEW_WIDTH,
        height: PREVIEW_HEIGHT,
        fps: PREVIEW_FPS,
    });

    const protocol = HTTPS_ENABLED ? 'https' : 'http';

    const basePublicUrl = getPublicUrl(PORT, protocol, SERVER_HOST);

    let entryUrl = entryTokenManager.getEntryUrl(basePublicUrl);

    let qrDataUrl = await QRCode.toDataURL(entryUrl);

    let overlay = await startQrOverlay({url: entryUrl, robot});

    const router = createApiRouter({
        publicDir,
        clientDir,
        utilsDir,
        getPublicUrl: () => entryUrl,
        getQrDataUrl: () => qrDataUrl,
    });
    app.use(entryTokenManager.makeHttpGuardMiddleware(), router);

    const updateChecker = await startUpdateChecker(notifier);

    const adminActions = createAdminActions({notifier, updateChecker});
    
    const registerControlEvents = createControlEventRegister({mouse, keyboard});
    const registerCommandEvents = createCommandEventRegister({browser});
    const registerAdminEvents = createAdminEventRegister({adminActions});
    const registerPreviewEvents = createPreviewEventRegister({preview});

    registerSocketHandlers(io, {
        eventRegistrars: [
            registerControlEvents,
            registerCommandEvents,
            registerAdminEvents,
            registerPreviewEvents,
        ],
        notifier,
        entryTokenManager,
        getEntryUrl: () => entryUrl,
    });

    notifyIfRestarted(notifier);

    entryTokenManager.startAutoRotation(async () => {
        entryUrl = entryTokenManager.getEntryUrl(basePublicUrl);
        qrDataUrl = await QRCode.toDataURL(entryUrl);

        if (overlay && overlay.close) {
            overlay.close();
        }
        overlay = await startQrOverlay({url: entryUrl, robot});

        io.emit('entry:update', {
            token: entryTokenManager.getCurrentToken(),
            url: entryUrl,
            path: entryTokenManager.getEntryPath(),
        });

        notifier.notify({
            level: 'warning',
            title: 'URL mise a jour',
            message: 'Le point d’entree a ete renouvele.',
            ttlMs: 3500,
        });
    });

    server.listen(PORT, () => {
        logStartupConfig();

        console.log('Remote Mouse server démarré');
        console.log(`URL: ${entryUrl}`);
        console.log(`QR web: ${entryUrl}/qr`);
        console.log('\nScanner ce QR avec le mobile:\n');

        qrcodeTerminal.generate(entryUrl, {small: true});
    });
}

function createHttpsServer(app) {
    if (!SSL_KEY_PATH || !SSL_CERT_PATH) {
        throw new Error(
            'HTTPS=true exige SSL_KEY_PATH et SSL_CERT_PATH.',
        );
    }

    const key = fs.readFileSync(SSL_KEY_PATH, 'utf8');
    const cert = fs.readFileSync(SSL_CERT_PATH, 'utf8');
    return https.createServer({key, cert}, app);
}
