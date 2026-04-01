import {createClientEndpointsRouter} from '../connection/api/client.router.js';
import fs from 'node:fs';
import path from 'node:path';
import {clientDir, projectRoot, publicDir, sharedUtilsDir} from '../utils/paths.js';
import cookieParser from 'cookie-parser';
import {
    createEntryRouter,
    createSessionCreationMiddleware,
    createSessionValidationMiddleware, createSessionRouter,
} from '../connection/api/session.middleware.js';
import {createQrPageHandler} from '../connection/api/qr-page.handler.js';
import {createLogger} from '../log/logger.js';
import {createServerInfoRouter} from '../connection/api/server-info.router.js';
import {getRecentLogs} from '../log/logger.js';
import {createAdminConfigActionsRouter, createAdminConfigRouter} from '../connection/api/admin-config.router.js';
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

export async function createApp(instances) {
    const {app, tokenManager, basePublicUrl, io, serverStartedAt, configService} = instances;
    const config = configService.get();
    const log = createLogger('createApp', configService);

    const getEntryUrl = () => `${basePublicUrl}/entry/${tokenManager.getToken()}`;

    if (!config.https.enabled) {
        log.warn('HTTPS=false: cookie session envoyé sans attribut Secure (moins sécuritaire).');
    }
    
    const cookies = cookieParser(config.session.cookieSecret);

    app.set('trust proxy', 'loopback');
    app.use(cookies);

    app.use(createSessionCreationMiddleware({
        cookieName: config.session.cookieName,
        cookieMaxAgeMs: Math.max(1, config.session.cookieMaxAgeDays) * 24 * 60 * 60 * 1000,
        secureCookies: config.https.enabled,
    }));

    app.use('/entry', createEntryRouter(tokenManager));
    app.use('/api/sessions', createSessionRouter(tokenManager));


    app.use(createSessionValidationMiddleware({
        tokenManager,
        cookieName: config.session.cookieName,
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

    app.use('/api/admin/server-info', createServerInfoRouter({
        publicDir,
        io,
        serverStartedAt,
        getConfigSnapshot: () => configService.get(),
        getRecentLogs,
        getVersion: readPackageVersion,
    }));

    app.use('/api/admin/configs', createAdminConfigsRouter({
        getConfigSnapshot: () => configService.get(),
        configService,
    }));

    app.use('/api/admin/restart-service', createAdminConfigActionsRouter({
        getConfigSnapshot: () => configService.get(),
    }));

    app.use('/ui/admin/config', createAdminConfigRouter({
        publicDir,
    }));

    app.use('/ui/admin/server-info', createServerInfoRouter({
        publicDir,
        io,
        serverStartedAt,
        getConfigSnapshot: () => configService.get(),
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
