import {createClientEndpointsRouter} from '../connection/api/client.router.js';
import fs from 'node:fs';
import path from 'node:path';
import {
    clientDir,
    projectRoot,
    publicDir,
    sharedUtilsDir
} from '../utils/paths.js';
import cookieParser from 'cookie-parser';
import {
    createEntryRouter,
    createSessionCreationMiddleware,
    createSessionValidationMiddleware,
    createSessionRouter,
} from '../connection/api/session.middleware.js';
import {createQrPageHandler} from '../connection/api/qr-page.handler.js';
import {createServerInfoRouter} from '../connection/api/server-info.router.js';
import {getRecentLogs} from '../services/log/logger.js';
import {
    createAdminConfigActionsRouter,
    createAdminConfigRouter
} from '../connection/api/admin-config.router.js';
import {createAdminConfigsRouter} from '../connection/api/admin-configs.router.js';

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

export function bootstrapApi(services) {
    const {
        getTokenManager,
        getConfig,
        getUrls,
        getSystemConfig,
        getLogger,
        getPersistence,
        getServer
    } = services;

    const {
        app,
        io,
        serverStartedAt,
        cookieParser
    } = getServer();

    const systemConfig = getSystemConfig();
    const log = getLogger('createApp');

    const tokenManager = getTokenManager();

    if (!systemConfig.https.enabled) {
        log.warn('HTTPS=false: cookie session envoyé sans attribut Secure (moins sécuritaire).');
    }
    app.set('trust proxy', 'loopback');
    
    app.use(cookieParser);

    app.use(createSessionCreationMiddleware({
        cookieName: systemConfig.session.cookieName,
        cookieMaxAgeMs: Math.max(1, systemConfig.session.cookieMaxAgeDays) * 24 * 60 * 60 * 1000,
        secureCookies: systemConfig.https.enabled,
    }));

    app.use('/entry', createEntryRouter(tokenManager));
    app.use('/api/sessions', createSessionRouter(tokenManager));


    app.use(createSessionValidationMiddleware({
        tokenManager,
        cookieName: systemConfig.session.cookieName,
    }));

    app.get('/qr', createQrPageHandler(getUrls().entryUrl));

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

    app.use('/api/admin/server-info', createServerInfoRouter({
        publicDir,
        io,
        serverStartedAt,
        getConfigSnapshot: getConfig,
        getRecentLogs,
        getVersion: readPackageVersion,
    }));

    app.use('/api/admin/configs', createAdminConfigsRouter({
        configDao: getPersistence().configDao,
        getConfigSnapshot: getConfig
    }));

    app.use('/api/admin/restart-service', createAdminConfigActionsRouter({
        getConfigSnapshot: getConfig,
    }));

    app.use('/ui/admin/config', createAdminConfigRouter({
        publicDir,
    }));

    app.use('/ui/admin/server-info', createServerInfoRouter({
        publicDir,
        io,
        serverStartedAt,
        getConfigSnapshot: getConfig,
        getRecentLogs,
        getVersion: readPackageVersion,
    }));

    app.get('/health', (_req, res) => {
        res.json({
            ok: true,
            version: readPackageVersion(),
        });
    });
}
