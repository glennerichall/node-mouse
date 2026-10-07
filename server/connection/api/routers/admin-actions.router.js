import express from 'express';

import {
    discoverSamsung,
    restartService,
} from '../handlers/admin-action.handlers.js';

export {
    buildManagedConfigPayload,
    coerceConfigValue,
} from '../configs.js';

export const adminConfigActionsRouter = express.Router()
    .post('/configs/samsung/discover', discoverSamsung)
    .post('/restart-service', restartService);
