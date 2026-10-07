import express from 'express';
import {getRemoteStatus} from '../handlers/remotes.handlers.js';

export const remotesRouter = express.Router();

remotesRouter.get('/:remoteId/status', getRemoteStatus);
