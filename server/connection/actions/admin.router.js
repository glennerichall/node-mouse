import Router from 'router';
import {adminGuard} from './admin.guard.js';
import {getClientId} from '../client-channel.js';

export const adminRouter = Router()
    .use(adminGuard)
    .use((req, _res, next) => {
        req.log.info({client: req.socket?.id}, `Demande ${req.originalUrl}`);
        next();
    })
    .get('/update', async (req, res) => {
        const result = await req.services.getRemotes().adminActions
            .forceUpdateCheck({clientId: getClientId(req.socket)});

        res.status(200).send({
            ok: Boolean(result.ok),
            message: result.message
        });
    })

    .post('/update', async (req, res) => {
        const result = await req.services.getRemotes().adminActions
            .installUpdate({clientId: getClientId(req.socket)});

        res.status(200).send({
            ok: Boolean(result.ok),
            message: result.message
        });
    })

    .post('/service', async (req, res) => {
        const result = await req.services.getRemotes().adminActions
            .restartService({clientId: getClientId(req.socket)});

        res.status(200).send({
            ok: Boolean(result.ok),
            message: result.message
        });
    })

    .post('/qr/browser', async (req, res) => {
        const result = await req.services.getRemotes().qrActions
            .openQrBrowserServer({clientId: getClientId(req.socket)});

        res.status(200).send({
            ok: Boolean(result.ok),
            message: result.message
        });
    })

    .post('/server-info/browser', async (req, res) => {
        const result = await req.services.getRemotes().adminActions
            .openServerInfoBrowserServer({clientId: getClientId(req.socket)});

        res.status(200).send({
            ok: Boolean(result.ok),
            message: result.message
        });
    })

    .post('/entry-token', async (req, res) => {
        const result = await req.services.getRemotes().qrActions
            .rotateEntryToken({clientId: getClientId(req.socket)});

        res.status(result.ok ? 201 : 400).send({
            ok: Boolean(result.ok),
            message: result.message
        });
    })

    .patch('/qr/overlay', async (req, res) => {
        const result = await req.services.getRemotes().qrActions
            .toggleQrOverlay({clientId: getClientId(req.socket)});

        res.status(200).send({
            ok: Boolean(result.ok),
            message: result.message
        });
    });
