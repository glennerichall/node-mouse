import {createAdminEventGuard} from './admin.guard.js';
import Router from 'router';
import {getClientId} from '../client-channel.js';

const adminGuard = createAdminEventGuard({
    getSystemConfig: (request) => request.services.getSystemConfig(),
    getAuthorization: (request) => request.services.getAuthorization(),
});

export const adminRouter = Router()
    .use(adminGuard)
    .use((req, _res, next) => {
        req.log.info({client: req.socket?.id}, `Demande ${req.originalUrl}`);
        next();
    })
    .post('/update-check', async (req, res, next) => {
        const result = await req.services.getRemotes().adminActions.forceUpdateCheck({clientId: getClientId(req.socket)});
        res.response?.({ok: Boolean(result.ok), message: result.message});
        next();
    })
    .post('/update-install', async (req, res, next) => {
        const result = await req.services.getRemotes().adminActions.installUpdate({clientId: getClientId(req.socket)});
        res.response?.({ok: Boolean(result.ok), message: result.message});
        next();
    })
    .post('/service-restart', async (req, res, next) => {
        const result = await req.services.getRemotes().adminActions.restartService({clientId: getClientId(req.socket)});
        res.response?.({ok: Boolean(result.ok), message: result.message});
        next();
    })
    .post('/open-qr-browser-server', async (req, res, next) => {
        const result = await req.services.getRemotes().qrActions.openQrBrowserServer({clientId: getClientId(req.socket)});
        res.response?.({ok: Boolean(result.ok), message: result.message});
        next();
    })
    .post('/open-qr-browser-client', async (req, res, next) => {
        const result = await req.services.getRemotes().qrActions.openQrBrowserClient({clientId: getClientId(req.socket)});
        res.response?.({ok: Boolean(result.ok), message: result.message});
        next();
    })
    .post('/open-server-info-browser-server', async (req, res, next) => {
        const result = await req.services.getRemotes().adminActions.openServerInfoBrowserServer({clientId: getClientId(req.socket)});
        res.response?.({ok: Boolean(result.ok), message: result.message});
        next();
    })
    .post('/open-server-info-browser-client', async (req, res, next) => {
        const result = await req.services.getRemotes().adminActions.openServerInfoBrowserClient({clientId: getClientId(req.socket)});
        res.response?.({ok: Boolean(result.ok), message: result.message});
        next();
    })
    .post('/rotate-entry-token', async (req, res, next) => {
        const result = await req.services.getRemotes().qrActions.rotateEntryToken({clientId: getClientId(req.socket)});
        res.response?.({ok: Boolean(result.ok), message: result.message});
        next();
    })
    .post('/toggle-qr-overlay', async (req, res, next) => {
        const result = await req.services.getRemotes().qrActions.toggleQrOverlay({clientId: getClientId(req.socket)});
        res.response?.({ok: Boolean(result.ok), message: result.message});
        next();
    });
