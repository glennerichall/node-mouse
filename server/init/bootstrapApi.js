import path from 'node:path';
import {projectRoot} from '../utils/paths.js';
import {staticShareRouter} from '../connection/api/routers/client.router.js';
import {
    sessionManagementRouter,
    sessionRouter,
} from '../connection/api/middlewares/session.middleware.js';
import {qrPageHandler} from '../connection/api/handlers/qr-page.handler.js';
import {adminUiRouter} from "./routers/createAdminUiRouter.js";
import {adminApiRouter, adminAuthRouter} from '../connection/api/routers/admin.router.js';
import {remotesRouter, clientApiRouter} from '../connection/api/routers/client.router.js';
import {createLogger} from '../application/logger.js';
import {createProxyTrust} from '../utils/clientAddress.js';
import {createRequestScopeMiddleware} from '../connection/api/middlewares/request-scope.middleware.js';
import {createHttpErrorMiddleware} from '../connection/api/middlewares/http-input.middleware.js';
import {securityIngressRouter, securityRouter} from '../connection/api/routers/security.router.js';
import {createHealthHandler} from './handlers/health.handler.js';
import {createPublicRouter} from './routers/public.router.js';
import {createProtectedRouter} from './routers/protected.router.js';

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
    app.use(createPublicRouter({
        staticShareRouter,
        sessionRouter,
        qrPageHandler,
        healthHandler: createHealthHandler(packageJsonPath),
    }));

    app.use(securityRouter);
    app.use(createProtectedRouter({
        sessionManagementRouter,
        clientApiRouter,
        remotesRouter,
        adminAuthRouter,
        adminApiRouter,
        adminUiRouter,
    }));
    log.trace('API routes registered');

    app.use(createHttpErrorMiddleware({log}));
}
