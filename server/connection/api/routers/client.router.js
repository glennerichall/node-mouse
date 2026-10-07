import express from 'express';
import {clientDir, publicDir, sharedUtilsDir} from '../../../utils/paths.js';
import {
  connectClientSubscription,
  createClientConfigSubscription,
  deleteClientSubscription,
  getClientConfig,
} from '../handlers/client-api.handlers.js';
import {listBrowsers, listRemotes} from '../handlers/admin-remotes.handlers.js';
import {getRemoteStatus} from '../handlers/remotes.handlers.js';

export const staticShareRouter = express.Router()
  .use(express.static(publicDir))
  .use('/client', express.static(clientDir))
  .use('/utils', express.static(sharedUtilsDir));

const clientSubsRouter = express.Router()
  .post('/configs', createClientConfigSubscription)
  .get('/:id', connectClientSubscription)
  .delete('/:id', deleteClientSubscription);

const remotesCatalogRouter = express.Router()
  .get('/browsers', listBrowsers)
  .get('/', listRemotes);

export const clientApiRouter = express.Router()
  .get('/config', getClientConfig)
  .use('/subs', clientSubsRouter)
  .use('/remotes', remotesCatalogRouter);

export const remotesRouter = express.Router()
  .get('/:remoteId/status', getRemoteStatus);
