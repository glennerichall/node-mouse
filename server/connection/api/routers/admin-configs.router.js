import express from 'express';

import {validateConfigPatch} from '../guards/config-validation.guard.js';
import {
    getConfig,
    listConfigs,
    patchConfig,
    resetConfig,
} from '../handlers/admin-config.handlers.js';

export const adminConfigsRouter = express.Router()
    .get('/', listConfigs)
    .get('/:configId', getConfig)
    .patch('/:configId', validateConfigPatch, patchConfig)
    .delete('/:configId', resetConfig);
