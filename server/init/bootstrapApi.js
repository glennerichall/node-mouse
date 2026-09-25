import {createStaticShareRouter} from '../connection/api/client.router.js';
import path from 'node:path';
import {
    clientDir,
    projectRoot,
    publicDir,
    sharedUtilsDir
} from '../utils/paths.js';
import {
    createSessionGuard,
    createSessionManagementRouter,
    createSessionRouter,
} from '../connection/api/session.middleware.js';
import {createQrPageHandler} from '../connection/api/qr-page.handler.js';
import {createAdminUiRouter} from "./createAdminUiRouter.js";
import {createAdminApiRouter} from "./createAdminApiRouter.js";
import { createRemotesRouter } from '../connection/api/remotes.router.js';
import {readPackageVersion} from '../utils/env.js';
import {createLogger} from '../application/logger.js';
import {createProxyTrust} from '../utils/clientAddress.js';

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

    const systemConfig = getSystemConfig();
    const log = createLogger('createApp');

    log.debug({
        httpsEnabled: Boolean(systemConfig.https.enabled),
        cookieName: systemConfig.session.cookieName,
        entryPathEnabled: Boolean(systemConfig.entryPath.enabled),
    }, 'Initialisation API Express');

    if (!systemConfig.https.enabled) {
        log.warn('HTTPS=false: cookie session envoyé sans attribut Secure (moins sécuritaire).');
    }
    app.set('trust proxy', createProxyTrust(systemConfig.trustProxy));
    
    app.use(cookieParser);

    app.use('/api/sessions', createSessionRouter(services));


    app.use(createSessionGuard(services));
    app.use('/api/sessions', createSessionManagementRouter(services));
    
    app.use(createStaticShareRouter({
        publicDir,
        clientDir,
        sharedUtilsDir
    }));
    
    app.get('/qr', createQrPageHandler(services));
    app.use('/api/remotes', createRemotesRouter(services));
    app.use('/api/admin', createAdminApiRouter(services));
    app.use('/ui/admin', createAdminUiRouter(services));
    log.trace('Routes API enregistrees');

    app.get('/health', (_req, res) => {
        res.json({
            ok: true,
            version: readPackageVersion(packageJsonPath),
        });
    });
}
