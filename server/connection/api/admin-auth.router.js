import express from 'express';
import {createRateLimitMiddleware} from '../security/createRateLimiter.js';
export {createAdminElevation, deleteAdminElevation} from './admin-auth.handlers.js';
import {createAdminElevation, deleteAdminElevation} from './admin-auth.handlers.js';

export const adminAuthRouter = express.Router()
  .use(createRateLimitMiddleware({
    limit: 5,
    windowMs: 5 * 60_000,
    methods: ['POST'],
    keyGenerator: (req) => req.securityContext?.deviceSessionId,
  }))
  .post('/elevation', createAdminElevation)
  .delete('/elevation', deleteAdminElevation);
