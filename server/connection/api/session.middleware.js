import express from 'express';
import {sendUnauthorizedResponse} from './unauthorized-response.js';

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

export function createSessionValidationMiddleware({
                                                      tokenManager,
                                                      cookieName
                                                  }) {
    return (req, res, next) => {
        const forwarded = getForwardedFor(req);
        const clientIp = forwarded || req.ip || req.socket?.remoteAddress;
        const allowBypass = isLocalAddress(clientIp);

        const token = req.signedCookies && req.signedCookies[cookieName];
        if (!allowBypass && !tokenManager.isValid(token)) {
            sendUnauthorizedResponse(req, res);
            return;
        }
        req.sessionToken = token;
        next();
    }
}

export function createEntryRouter(tokenManager) {
    const router = express.Router();

    router.get('/:token', (req, res) => {
        if (tokenManager.isValid(req.params.token)) {
            res.createSession(req.params.token);
            res.redirect('/');
        } else {
            sendUnauthorizedResponse(req, res);
        }
    });

    return router;
}

export function createSessionRouter(tokenManager) {
  const router = express.Router();

  router.post('/:token', (req, res) => {
    const token = req.params.token;
    if (!tokenManager.isValid(token)) {
      res.status(401).json({ ok: false, message: 'Invalid token' });
      return;
    }
    res.createSession(token);
    res.status(204).end();
  });

  return router;
}
