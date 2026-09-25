import express from 'express';
import {sendUnauthorizedResponse} from './unauthorized-response.js';
import {
    PUBSUB_EVENT_SESSION_CREATED,
    PUBSUB_SERVICE_SESSION
} from '../../services/pubsub/serviceEventConstants.js';

export function sessionGuardMiddleware(req, res, next) {
    const decision = req.services.getSecurity().authenticate();
    req.securityContext = decision.context;
    if (!decision.allowed) {
        sendUnauthorizedResponse(req, res);
        return;
    }
    next();
}

export const sessionManagementRouter = express.Router();

sessionManagementRouter.delete('/current', (req, res) => {
    const {services} = req;
    const sessionId = req.securityContext?.deviceSessionId;
    if (req.securityContext?.authenticationMethod !== 'session' || !sessionId) {
        sendUnauthorizedResponse(req, res);
        return;
    }

    services.getDeviceSessionService().revokeSession(sessionId);
    const config = services.getSystemConfig();
    res.clearCookie(config.session.cookieName, {
        httpOnly: true,
        secure: Boolean(config.https.enabled),
        sameSite: 'lax',
        path: '/',
    });
    res.status(204).end();
});

export const sessionRouter = express.Router();

const issueDeviceSession = (req, res, next) => {
    const {services} = req;
    const context = services.getSecurity().createClientContext();

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

    next();
};

const guardToken = (req, res, next) => {
    const {services} = req;
    const tokenManager = services.getTokenManager();
    const token = req.params.token;
    if (!tokenManager.isValid(token)) {
        sendUnauthorizedResponse(req, res);
        return;
    }
    next();
};

const redirect = (req, res) => res.redirect('/');

sessionRouter.get('/:token',
    guardToken,
    issueDeviceSession,
    redirect);
