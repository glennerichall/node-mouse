import express from 'express';
import {sendUnauthorizedResponse} from './unauthorized-response.js';
import {
    PUBSUB_EVENT_SESSION_CREATED,
    PUBSUB_SERVICE_SESSION
} from '../../services/pubsub/serviceEventConstants.js';

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
        const decision = services.getSecurity().authenticateHttp(req);
        req.securityContext = decision.context;
        if (!decision.allowed) {
            onUnauthorized(req, res);
            return;
        }
        next();
    }
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
        services.getEvents().publishEvent(PUBSUB_SERVICE_SESSION, PUBSUB_EVENT_SESSION_CREATED, {
            address: securityContext.clientAddress,
            correlationId: securityContext.correlationId,
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
