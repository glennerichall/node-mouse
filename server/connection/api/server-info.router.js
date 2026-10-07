import express from 'express';
import {
  buildConfigSnapshots,
  buildTokenEntries,
  getServerInfoData,
  getServerInfoPage,
  redactSecrets,
} from './server-info.handlers.js';

export const serverInfoRouter = express.Router()
  .get('/', getServerInfoPage)
  .get('/data', getServerInfoData);

export const __testables = {
  buildTokenEntries,
  buildConfigSnapshots,
  redactSecrets,
};
