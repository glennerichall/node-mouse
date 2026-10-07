import express from 'express';

import {
  connectClientSubscription,
  createClientConfigSubscription,
  deleteClientSubscription,
  getClientConfig,
} from '../handlers/client-api.handlers.js';
import {remotesCatalogRouter} from './remotes-catalog.router.js';

export const clientSubsRouter = express.Router()
  .post('/configs', createClientConfigSubscription)
  .get('/:id', connectClientSubscription)
  .delete('/:id', deleteClientSubscription);

export const clientApiRouter = express.Router()
  .get('/config', getClientConfig)
  .use('/subs', clientSubsRouter)
  .use('/remotes', remotesCatalogRouter);
