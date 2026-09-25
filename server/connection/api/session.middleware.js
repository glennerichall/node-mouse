import express from 'express';
import {sendUnauthorizedResponse} from './unauthorized-response.js';
import {
    PUBSUB_EVENT_SESSION_CREATED,
    PUBSUB_SERVICE_SESSION
} from '../../services/pubsub/serviceEventConstants.js';

export function createSessionGuard(services, {
    onUnauthorized = sendUnauthorizedResponse,
} = {}) {
    return (req, res, next) => {
        const decision = services.getSecurity().authenticateHttp(req);
        req.securityContext = decision.context;
        if (!decision.allowed) {
            onUnauthorized(req, res);
            return;
        }
        next();
    }
}

export function issueDeviceSession(services, req, res, securityContext = null) {
    const context = securityContext || services.getSecurity().createClientContext({
        transport: 'http',
        request: req,
    });
    const {token, session} = services.getDeviceSessionService().createSession({
        clientAddress: context.clientAddress,
        userAgent: req.get?.('user-agent') || req.headers?.['user-agent'] || '',
    });

    services.getEvents().publishEvent(PUBSUB_SERVICE_SESSION, PUBSUB_EVENT_SESSION_CREATED, {
        address: context.clientAddress,
        correlationId: context.correlationId,
        sessionId: session.id,
    });
    const config = services.getSystemConfig();
    res.cookie(config.session.cookieName, token, {
        signed: true,
        httpOnly: true,
        secure: Boolean(config.https.enabled),
        sameSite: 'lax',
        maxAge: Math.max(1, config.session.cookieMaxAgeDays) * 24 * 60 * 60 * 1000,
        path: '/',
    });
    return session;
}

export function createSessionManagementRouter(services) {
    const router = express.Router();

    router.delete('/current', (req, res) => {
        const sessionId = req.securityContext?.deviceSessionId;
        if (req.securityContext?.authenticationMethod !== 'session' || !sessionId) {
            sendUnauthorizedResponse(req, res);
            return;
        }

        services.getDeviceSessionService().revokeSession(sessionId);
        const sessionConfig = services.getSystemConfig().session;
        res.clearCookie(sessionConfig.cookieName, {
            httpOnly: true,
            secure: Boolean(services.getSystemConfig().https.enabled),
            sameSite: 'lax',
            path: '/',
        });
        res.status(204).end();
    });

    return router;
}

export function createSessionRouter(services) {
    const router = express.Router();

    router.get('/:token', (req, res) => {
        const tokenManager = services.getTokenManager();
        const token = req.params.token;
        if (!tokenManager.isValid(token)) {
            sendUnauthorizedResponse(req, res);
            return;
        }
        const securityContext = services.getSecurity().createClientContext({
            transport: 'http',
            request: req,
        });
        issueDeviceSession(services, req, res, securityContext);
        res.redirect('/');
    });

    return router;
}
