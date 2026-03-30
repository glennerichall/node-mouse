import express from "express";
import {sendUnauthorizedResponse} from "./unauthorized-response.js";

function isLocalHostName(value) {
    const host = String(value || '').toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function isLocalAddress(value) {
    const address = String(value || '').toLowerCase();
    return (
        address === '127.0.0.1'
        || address === '::1'
        || address === '::ffff:127.0.0.1'
    );
}

function isLocalRequest(req) {
    const hostHeader = String(req.headers?.host || '').split(':')[0];
    return (
        isLocalAddress(req.ip)
        || isLocalAddress(req.socket?.remoteAddress)
        || isLocalHostName(req.hostname)
        || isLocalHostName(hostHeader)
    );
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
        if (isLocalRequest(req)) {
            req.sessionToken = req.signedCookies && req.signedCookies[cookieName];
            next();
            return;
        }

        const token = req.signedCookies && req.signedCookies[cookieName];
        if (!tokenManager.isValid(token)) {
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
