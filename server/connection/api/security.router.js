import express from 'express';
import {sessionGuardMiddleware} from './session.middleware.js';
import {createRateLimitMiddleware} from '../security/createRateLimiter.js';
import {
    httpOriginGuard,
    sessionCsrfGuard
} from '../security/origin.js';
import {httpJsonBodyParser} from './http-input.middleware.js';

export const securityIngressRouter = express.Router()
    .use(httpJsonBodyParser)
    .use(httpOriginGuard)
    .use('/api/sessions', createRateLimitMiddleware({
        limit: 10,
        windowMs: 60_000,
        methods: ['GET'],
    }));

export const securityRouter = express.Router()
    .use(sessionGuardMiddleware)
    .use(sessionCsrfGuard)
    .use(createRateLimitMiddleware({
        limit: 60,
        windowMs: 60_000,
        keyGenerator: (req) => req.securityContext?.deviceSessionId,
    }));
