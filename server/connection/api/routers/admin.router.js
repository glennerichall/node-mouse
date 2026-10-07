import express from 'express';
import {createRateLimitMiddleware} from '../../security/createRateLimiter.js';
import {guardAdmin} from '../guards/admin.guard.js';
import {validateConfigPatch} from '../guards/config-validation.guard.js';
import {
  createAdminElevation,
  deleteAdminElevation,
} from '../handlers/admin-auth.handlers.js';
import {discoverSamsung, restartService} from '../handlers/admin-action.handlers.js';
import {
  getConfig,
  listConfigs,
  patchConfig,
  resetConfig,
} from '../handlers/admin-config.handlers.js';
import {
  listBrowsers,
  listRemotes,
} from '../handlers/admin-remotes.handlers.js';
import {
  listDeviceSessions,
  revokeAllDeviceSessions,
  revokeDeviceSession,
} from '../handlers/admin-sessions.handlers.js';
import {
  connectAdminSubscription,
  createAdminConfigSubscription,
  deleteAdminSubscription,
} from '../handlers/admin-subs.handlers.js';
import {
  buildConfigSnapshots,
  buildTokenEntries,
  getServerInfoData,
  getServerInfoPage,
  redactSecrets,
} from '../handlers/server-info.handlers.js';

const adminAuthRoutes = express.Router()
  .use(createRateLimitMiddleware({
    limit: 5,
    windowMs: 5 * 60_000,
    methods: ['POST'],
    keyGenerator: (req) => req.securityContext?.deviceSessionId,
  }))
  .post('/elevation', createAdminElevation)
  .delete('/elevation', deleteAdminElevation);

const adminConfigsRouter = express.Router()
  .get('/', listConfigs)
  .get('/:configId', getConfig)
  .patch('/:configId', validateConfigPatch, patchConfig)
  .delete('/:configId', resetConfig);

const adminActionsRouter = express.Router()
  .post('/configs/samsung/discover', discoverSamsung)
  .post('/restart-service', restartService);

const adminSessionsRouter = express.Router()
  .get('/', listDeviceSessions)
  .delete('/', revokeAllDeviceSessions)
  .delete('/:sessionId', revokeDeviceSession);

const adminSubsRouter = express.Router()
  .post('/configs', createAdminConfigSubscription)
  .get('/:id', connectAdminSubscription)
  .delete('/:id', deleteAdminSubscription);

const remotesCatalogRouter = express.Router()
  .get('/browsers', listBrowsers)
  .get('/', listRemotes);

const serverInfoRouter = express.Router()
  .get('/', getServerInfoPage)
  .get('/data', getServerInfoData);

export const adminAuthRouter = adminAuthRoutes;

export const adminApiRouter = express.Router()
  .use(guardAdmin)
  .use('/server-info', serverInfoRouter)
  .use('/configs', adminConfigsRouter)
  .use('/remotes', remotesCatalogRouter)
  .use('/sessions', adminSessionsRouter)
  .use('/subs', adminSubsRouter)
  .use('/', adminActionsRouter);

export const __testables = {
  buildConfigSnapshots,
  buildTokenEntries,
  redactSecrets,
};
