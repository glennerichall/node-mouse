import {createClientEndpointsRouter} from '../connection/client.router.js';
import {
    clientDir,
    clientUtilsDir,
    publicDir,
    sharedUtilsDir
} from '../../utils/server/paths.js';
import {
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
} from '../connection/session.middleware.js';

export async function createApp(instances) {

    const {app, tokenManager, basePublicUrl} = instances;

    const getEntryUrl = () => `${basePublicUrl}/entry/${tokenManager.getToken()}`;

    if (!HTTPS_ENABLED) {
        console.warn('WARNING: HTTPS=false. Cookie session envoyé sans attribut Secure (moins sécuritaire).');
    }
    
    const cookies = cookieParser(SESSION_COOKIE_SECRET);

    app.use(cookies);

    app.use(createSessionCreationMiddleware({
        cookieName: SESSION_COOKIE_NAME,
        cookieMaxAgeMs: Math.max(1, SESSION_COOKIE_MAX_AGE_DAYS) * 24 * 60 * 60 * 1000,
        secureCookies: HTTPS_ENABLED,
    }));

    app.use('/entry', createEntryRouter(tokenManager));

    // app.get('/qr', createQrPageHandler(getEntryUrl));

    app.use(createSessionValidationMiddleware({
        tokenManager,
        cookieName: SESSION_COOKIE_NAME,
    }));

    app.get('/', (req, res, next) => {
        if (req.sessionToken) {
            res.createSession(req.sessionToken);
        }
        next();
    });

    app.use(createClientEndpointsRouter({
        publicDir,
        clientDir,
        sharedUtilsDir,
        clientUtilsDir
    }));

    app.get('/health', (_req, res) => {
        res.json({ok: true});
    });

    return {
        ...instances,
        getEntryUrl,
        cookies
    };

}
