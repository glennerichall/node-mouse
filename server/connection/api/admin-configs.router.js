import express from 'express';

import {validateConfigPatch} from './config-validation.middleware.js';
import {
    getConfig,
    listConfigs,
    patchConfig,
    resetConfig,
} from './admin-config.handlers.js';

export const adminConfigsRouter = express.Router()
    .get('/', listConfigs)
    .get('/:configId', getConfig)
    .patch('/:configId', validateConfigPatch, patchConfig)
    .delete('/:configId', resetConfig);
