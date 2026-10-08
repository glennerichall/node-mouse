import {adminGuard} from './admin.guard.js';
import Router from 'router';
import {getClientId} from '../client-channel.js';

export const adminRouter = Router()
    .use(adminGuard)
    .use((req, _res, next) => {
        req.log.info({client: req.socket?.id}, `Demande ${req.originalUrl}`);
        next();
    })
    .post('/update-check', async (req, res, next) => {
        const result = await req.services.getRemotes().adminActions.forceUpdateCheck({clientId: getClientId(req.socket)});
        res.status(200).send({ok: Boolean(result.ok), message: result.message});
    })
    .post('/update-install', async (req, res, next) => {
        const result = await req.services.getRemotes().adminActions.installUpdate({clientId: getClientId(req.socket)});
        res.status(200).send({ok: Boolean(result.ok), message: result.message});
    })
    .post('/service-restart', async (req, res, next) => {
        const result = await req.services.getRemotes().adminActions.restartService({clientId: getClientId(req.socket)});
        res.status(200).send({ok: Boolean(result.ok), message: result.message});
    })
    .post('/open-qr-browser-server', async (req, res, next) => {
        const result = await req.services.getRemotes().qrActions.openQrBrowserServer({clientId: getClientId(req.socket)});
        res.status(200).send({ok: Boolean(result.ok), message: result.message});
    })
    .post('/open-qr-browser-client', async (req, res, next) => {
        const result = await req.services.getRemotes().qrActions.openQrBrowserClient({clientId: getClientId(req.socket)});
        res.status(200).send({ok: Boolean(result.ok), message: result.message});
    })
    .post('/open-server-info-browser-server', async (req, res, next) => {
        const result = await req.services.getRemotes().adminActions.openServerInfoBrowserServer({clientId: getClientId(req.socket)});
        res.status(200).send({ok: Boolean(result.ok), message: result.message});
    })
    .post('/open-server-info-browser-client', async (req, res, next) => {
        const result = await req.services.getRemotes().adminActions.openServerInfoBrowserClient({clientId: getClientId(req.socket)});
        res.status(200).send({ok: Boolean(result.ok), message: result.message});
    })
    .post('/rotate-entry-token', async (req, res, next) => {
        const result = await req.services.getRemotes().qrActions.rotateEntryToken({clientId: getClientId(req.socket)});
        res.status(200).send({ok: Boolean(result.ok), message: result.message});
    })
    .post('/toggle-qr-overlay', async (req, res, next) => {
        const result = await req.services.getRemotes().qrActions.toggleQrOverlay({clientId: getClientId(req.socket)});
        res.status(200).send({ok: Boolean(result.ok), message: result.message});
    });
