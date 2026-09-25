import {staticShareRouter} from '../connection/api/client.router.js';
import path from 'node:path';
import {projectRoot} from '../utils/paths.js';
import {
    sessionGuardMiddleware,
    sessionManagementRouter,
    sessionRouter,
} from '../connection/api/session.middleware.js';
import {qrPageHandler} from '../connection/api/qr-page.handler.js';
import {adminUiRouter} from "./createAdminUiRouter.js";
import {adminApiRouter} from "./createAdminApiRouter.js";
import {remotesRouter} from '../connection/api/remotes.router.js';
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

    app.use((req, _res, next) => {
        req.services = services;
        next();
    });

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

    app.use('/api/sessions', sessionRouter);


    app.use(sessionGuardMiddleware);
    app.use('/api/sessions', sessionManagementRouter);
    
    app.use(staticShareRouter);
    
    app.get('/qr', qrPageHandler);
    app.use('/api/remotes', remotesRouter);
    app.use('/api/admin', adminApiRouter);
    app.use('/ui/admin', adminUiRouter);
    log.trace('Routes API enregistrees');

    app.get('/health', (_req, res) => {
        res.json({
            ok: true,
            version: readPackageVersion(packageJsonPath),
        });
    });
}
