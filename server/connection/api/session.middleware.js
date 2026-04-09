import express from 'express';
import {sendUnauthorizedResponse} from './unauthorized-response.js';
import {
    PUBSUB_EVENT_SESSION_CREATED,
    PUBSUB_SERVICE_SESSION
} from '../../services/pubsub/serviceEventConstants.js';

function isLocalAddress(value) {
    const address = String(value || '').toLowerCase();
    return (
        address === '127.0.0.1'
        || address === '::1'
        || address === '::ffff:127.0.0.1'
    );
}

function getForwardedFor(req) {
    const raw = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
    return raw || null;
}

export const createSessionCreationMiddleware = ({
                                                    cookieName,
                                                    cookieMaxAgeMs,
                                                    secureCookies = true,
                                                }) => (req, res, next) => {
    res.createSession = (token) => {
        res.cookie(cookieName, token,
            {
                signed: true,
                httpOnly: true,
                secure: secureCookies,
                sameSite: 'lax',
                maxAge: cookieMaxAgeMs,
                path: '/',
            });
    }
    next();
}

export function createSessionGuard(services, {
    onUnauthorized = sendUnauthorizedResponse,
} = {}) {
    return (req, res, next) => {
        const tokenManager = services.getTokenManager();
        const cookieName = services.getSystemConfig().session.cookieName;
        const forwarded = getForwardedFor(req);
        const clientIp = forwarded || req.ip || req.socket?.remoteAddress;
        const allowBypass = isLocalAddress(clientIp);

        const token = req.signedCookies && req.signedCookies[cookieName];
        if (!allowBypass && !tokenManager.isValid(token)) {
            onUnauthorized(req, res);
            return;
        }
        req.sessionToken = token;
        next();
    }
}

export function createSessionRouter(services) {
    const router = express.Router();
  // const postSessionGuard = createSessionGuard({
  //   services,
  //   onUnauthorized: (_req, res) => {
  //     res.status(401).json({ok: false, message: 'Invalid token'});
  //   },
  // });

    router.get('/:token', (req, res) => {
        const tokenManager = services.getTokenManager();
        const token = req.params.token;
        if (!tokenManager.isValid(token)) {
            sendUnauthorizedResponse(req, res);
            return;
        }
        const forwarded = getForwardedFor(req);
        const clientIp = forwarded || req.ip || req.socket?.remoteAddress || '';
        services.getEvents().publishEvent(PUBSUB_SERVICE_SESSION, PUBSUB_EVENT_SESSION_CREATED, {
            address: String(clientIp || '').trim(),
            token,
        });
        res.createSession(token);
        res.redirect('/');
    });

  // router.post('/:token', (req, res, next) => {
  //   req.signedCookies = {
  //     ...req.signedCookies,
  //     [services.getSystemConfig().session.cookieName]: req.params.token,
  //   };
  //   next();
  // }, postSessionGuard, (req, res) => {
  //       res.createSession(req.params.token);
  //       res.status(204).end();
  //   });

    return router;
}
