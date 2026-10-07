import {staticShareRouter} from '../connection/api/routers/client.router.js';
import path from 'node:path';
import {projectRoot} from '../utils/paths.js';
import {
    sessionManagementRouter,
    sessionRouter,
} from '../connection/api/middlewares/session.middleware.js';
import {qrPageHandler} from '../connection/api/handlers/qr-page.handler.js';
import {adminUiRouter} from "./routers/createAdminUiRouter.js";
import {adminApiRouter} from "./routers/createAdminApiRouter.js";
import {remotesRouter} from '../connection/api/routers/remotes.router.js';
import {readPackageVersion} from '../utils/env.js';
import {createLogger} from '../application/logger.js';
import {createProxyTrust} from '../utils/clientAddress.js';
import {createRequestScopeMiddleware} from '../connection/api/middlewares/request-scope.middleware.js';
import {createHttpErrorMiddleware} from '../connection/api/middlewares/http-input.middleware.js';
import {securityIngressRouter, securityRouter} from '../connection/api/routers/security.router.js';
import {clientApiRouter} from '../connection/api/routers/client-api.router.js';
import {adminAuthRouter} from '../connection/api/routers/admin-auth.router.js';

const packageJsonPath = path.join(projectRoot, 'package.json');

export function bootstrapApi(services) {
    const {
        getSystemConfig,
        getServer,
    } = services;

    const {
        app,
        cookieParser
    } = getServer();
    
    const log = createLogger('createApp');

    app.use(createRequestScopeMiddleware(services));

    const systemConfig = getSystemConfig();

    log.debug({
        httpsEnabled: Boolean(systemConfig.https.enabled),
        cookieName: systemConfig.session.cookieName,
        entryPathEnabled: Boolean(systemConfig.entryPath.enabled),
    }, 'Initialisation API Express');

    if (!systemConfig.https.enabled) {
        log.warn('HTTPS=false: session cookie sent without the Secure attribute (less secure).');
    }
    app.set('trust proxy', createProxyTrust(systemConfig.trustProxy));

    app.use(cookieParser);
    app.use(securityIngressRouter);
    app.use('/api/sessions', sessionRouter);

    app.use(securityRouter);
    app.use('/api/sessions', sessionManagementRouter);

    app.use(staticShareRouter);

    app.get('/qr', qrPageHandler);
    app.use('/api/client', clientApiRouter);
    app.use('/api/admin-auth', adminAuthRouter);
    app.use('/api/remotes', remotesRouter);
    app.use('/api/admin', adminApiRouter);
    app.use('/ui/admin', adminUiRouter);
    log.trace('API routes registered');

    app.get('/health', (_req, res) => {
        res.json({
            ok: true,
            version: readPackageVersion(packageJsonPath),
        });
    });

    app.use(createHttpErrorMiddleware({log}));
}
