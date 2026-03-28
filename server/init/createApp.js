import {createClientEndpointsRouter} from '../connection/api/client.router.js';
import fs from 'node:fs';
import path from 'node:path';
import {
    clientDir,
    projectRoot,
    publicDir,
    sharedUtilsDir
} from '../../utils/server/paths.js';
import {
    getStartupConfigSnapshot,
    HTTPS_ENABLED,
    SESSION_COOKIE_MAX_AGE_DAYS,
    SESSION_COOKIE_NAME,
    SESSION_COOKIE_SECRET,
} from './config.js';
import cookieParser from 'cookie-parser';
import {
    createEntryRouter,
    createSessionCreationMiddleware,
    createSessionValidationMiddleware
} from '../connection/api/session.middleware.js';
import {createQrPageHandler} from '../connection/api/qr-page.handler.js';
import {createLogger} from '../log/logger.js';
import {createServerInfoRouter} from '../connection/api/server-info.router.js';
import {getRecentLogs} from '../log/logger.js';

const log = createLogger('createApp');
const packageJsonPath = path.join(projectRoot, 'package.json');

function readPackageVersion() {
    try {
        const raw = fs.readFileSync(packageJsonPath, 'utf8');
        const parsed = JSON.parse(raw);
        return String(parsed?.version || '').trim() || 'unknown';
    } catch (_error) {
        return 'unknown';
    }
}

export async function createApp(instances) {

    const {app, tokenManager, basePublicUrl, io, serverStartedAt} = instances;

    const getEntryUrl = () => `${basePublicUrl}/entry/${tokenManager.getToken()}`;

    if (!HTTPS_ENABLED) {
        log.warn('HTTPS=false: cookie session envoyé sans attribut Secure (moins sécuritaire).');
    }
    
    const cookies = cookieParser(SESSION_COOKIE_SECRET);

    app.use(cookies);

    app.use(createSessionCreationMiddleware({
        cookieName: SESSION_COOKIE_NAME,
        cookieMaxAgeMs: Math.max(1, SESSION_COOKIE_MAX_AGE_DAYS) * 24 * 60 * 60 * 1000,
        secureCookies: HTTPS_ENABLED,
    }));

    app.use('/entry', createEntryRouter(tokenManager));


    app.use(createSessionValidationMiddleware({
        tokenManager,
        cookieName: SESSION_COOKIE_NAME,
    }));

    app.get('/qr', createQrPageHandler(getEntryUrl));
    
    app.get('/', (req, res, next) => {
        if (req.sessionToken) {
            res.createSession(req.sessionToken);
        }
        next();
    });

    app.use(createClientEndpointsRouter({
        publicDir,
        clientDir,
        sharedUtilsDir
    }));

    app.use('/admin/server-info', createServerInfoRouter({
        publicDir,
        io,
        serverStartedAt,
        getConfigSnapshot: getStartupConfigSnapshot,
        getRecentLogs,
        getVersion: readPackageVersion,
    }));

    app.get('/health', (_req, res) => {
        res.json({
            ok: true,
            version: readPackageVersion(),
        });
    });

    return {
        ...instances,
        getEntryUrl,
        cookies
    };

}
