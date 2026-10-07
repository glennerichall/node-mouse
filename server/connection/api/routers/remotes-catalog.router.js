import express from 'express';
import {listBrowsers, listRemotes} from '../handlers/admin-remotes.handlers.js';

export const remotesCatalogRouter = express.Router()
  .get('/browsers', listBrowsers)
  .get('/', listRemotes);
