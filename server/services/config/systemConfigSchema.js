import Joi from 'joi';

const optionalString = Joi.string().allow('').optional();
const commandString = Joi.string().allow('').optional();

export const SYSTEM_CONFIG_SCHEMA = Joi.object({
  port: Joi.number().integer().min(1).max(65535).required(),
  serverHost: optionalString,
  listenHost: optionalString,
  publicBaseUrl: optionalString,
  trustProxy: optionalString,
  allowedOrigins: Joi.array().items(Joi.string().trim()).default([]),
  entryPath: Joi.object({
    enabled: Joi.boolean().required(),
    fixed: optionalString,
    tokenLength: Joi.number().integer().min(8).max(256).required(),
    rotateMin: Joi.number().min(0).required(),
    graceMin: Joi.number().min(0).required(),
  }).required(),
  session: Joi.object({
    cookieName: Joi.string().min(1).required(),
    cookieSecret: Joi.string().min(1).required(),
    cookieMaxAgeDays: Joi.number().positive().required(),
    socketEventMaxAgeMs: Joi.number().positive().required(),
  }).required(),
  adminActionsEnabled: Joi.boolean().required(),
  admin: Joi.object({
    password: optionalString,
    passwordMinLength: Joi.number().integer().min(1).required(),
    unlockMinutes: Joi.number().positive().required(),
  }).required(),
  serviceName: Joi.string().min(1).required(),
  serviceRestartCommand: commandString,
  updateCheck: Joi.object({
    checkCommand: commandString,
    checkTimeoutSec: Joi.number().positive().required(),
    packageName: Joi.string().allow('').required(),
    currentVersion: Joi.string().allow('').required(),
    installCommand: commandString,
    installTimeoutSec: Joi.number().positive().required(),
  }).required(),
  https: Joi.object({
    enabled: Joi.boolean().required(),
    sslKeyPath: Joi.string().allow('').optional(),
    sslCertPath: Joi.string().allow('').optional(),
  }).required(),
  persistence: Joi.object({
    dbPath: Joi.string().min(1).required(),
  }).required(),
  logging: Joi.object({
    level: Joi.string().valid('trace', 'debug', 'info', 'warn', 'error', 'fatal').required(),
    format: Joi.string().valid('json', 'pretty').required(),
  }).required(),
}).unknown(false);

export function validateSystemConfig(config) {
  const {error, value} = SYSTEM_CONFIG_SCHEMA.validate(config, {
    abortEarly: false,
    allowUnknown: false,
    convert: true,
  });

  if (error) {
    throw new Error(`Invalid system configuration: ${error.details.map((detail) => detail.message).join('; ')}`);
  }

  return value;
}
