import Joi from 'joi';
import {CONFIG_PATHS} from '../../../services/config/configPaths.js';
import {
  adminConfigSchema,
  getConfigValueSchema,
  getFieldDefinition,
} from '../configs.js';

function reject(res, status, message) {
  res.status(status).json({ok: false, message});
}

/**
 * Validates the PATCH contract and stores the converted value on the request.
 * The route handler only deals with persistence after this guard succeeds.
 */
export function validateConfigPatch(req, res, next) {
  const pathKey = String(req.params.configId || '').trim();
  if (!CONFIG_PATHS.includes(pathKey)) {
    reject(res, 404, 'Invalid config path.');
    return;
  }

  const field = getFieldDefinition(adminConfigSchema, pathKey);
  const payload = Joi.object({
    value: Joi.any().required().allow(null),
  }).unknown(false).validate(req.body, {abortEarly: false});

  if (payload.error) {
    reject(res, 400, 'Invalid payload: value expected.');
    return;
  }

  if (payload.value.value === null) {
    req.configPatch = {pathKey, field, value: null};
    next();
    return;
  }

  const valueValidation = getConfigValueSchema(pathKey, adminConfigSchema).validate(payload.value.value, {
    abortEarly: false,
    convert: true,
  });
  if (valueValidation.error) {
    reject(res, 400, 'Configuration invalide.');
    return;
  }

  req.configPatch = {pathKey, field, value: valueValidation.value};
  next();
}
