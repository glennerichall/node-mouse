import express from 'express';
import {
  connectAdminSubscription,
  createAdminConfigSubscription,
  deleteAdminSubscription,
} from '../handlers/admin-subs.handlers.js';

export const adminSubsRouter = express.Router()
  .post('/configs', createAdminConfigSubscription)
  .get('/:id', connectAdminSubscription)
  .delete('/:id', deleteAdminSubscription);
