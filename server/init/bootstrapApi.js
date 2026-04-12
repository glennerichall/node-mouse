import {createStaticShareRouter} from '../connection/api/client.router.js';
import path from 'node:path';
import {
    clientDir,
    projectRoot,
    publicDir,
    sharedUtilsDir
} from '../utils/paths.js';
import {
    createSessionCreationMiddleware,
    createSessionGuard,
    createSessionRouter,
} from '../connection/api/session.middleware.js';
import {createQrPageHandler} from '../connection/api/qr-page.handler.js';
import {createAdminUiRouter} from "./createAdminUiRouter.js";
import {createAdminApiRouter} from "./createAdminApiRouter.js";
import { createRemotesRouter } from '../connection/api/remotes.router.js';
import {readPackageVersion} from '../utils/env.js';
import {createLogger} from '../application/logger.js';

const packageJsonPath = path.join(projectRoot, 'package.json');

export function bootstrapApi(services) {
    const {
        getTokenManager,
        getSystemConfig,
        getServer,
    } = services;

    const {
        app,
        cookieParser
    } = getServer();

    const systemConfig = getSystemConfig();
    const log = createLogger('createApp');

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

    app.use('/api/sessions', createSessionRouter(services));

    app.use(createStaticShareRouter({
        publicDir,
        clientDir,
        sharedUtilsDir
    }));

    app.use(createSessionGuard(services));

    app.get('/qr', createQrPageHandler(services));

    app.get('/', (req, res, next) => {
        if (req.sessionToken) {
            res.createSession(getTokenManager().getToken());
        }
        next();
    });

    app.use('/api/remotes', createRemotesRouter(services));
    app.use('/api/admin', createAdminApiRouter(services));
    app.use('/ui/admin', createAdminUiRouter(services));

    app.get('/health', (_req, res) => {
        res.json({
            ok: true,
            version: readPackageVersion(packageJsonPath),
        });
    });
}
