import express from 'express';
import {clientDir, publicDir, sharedUtilsDir} from '../../utils/paths.js';

export const staticShareRouter = express.Router();

staticShareRouter.use(express.static(publicDir));
staticShareRouter.use('/client', express.static(clientDir));
staticShareRouter.use('/utils', express.static(sharedUtilsDir));
