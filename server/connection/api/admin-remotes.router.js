import express from 'express';
import {listBrowsers, listRemotes} from './admin-remotes.handlers.js';

export const adminRemotesRouter = express.Router()
  .get('/browsers', listBrowsers)
  .get('/', listRemotes);
