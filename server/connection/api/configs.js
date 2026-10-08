import Joi from 'joi';
import {CONFIG_PATHS} from '../../services/config/configPaths.js';
import {getConfigFieldDefinition, getManagedConfigSchema} from '../../services/config/configSchema.js';
import {DEFAULT_PERSISTED_CONFIG} from '../../services/config/defaultConfig.js';
import {setNestedValue} from '../../../utils/object.utils.js';

export const adminConfigSchema = getManagedConfigSchema(CONFIG_PATHS);

export function getValueAtPath(source, dottedPath) {
  return String(dottedPath || '')
    .split('.')
    .filter(Boolean)
    .reduce((cursor, segment) => (cursor == null ? undefined : cursor[segment]), source);
}

export function coerceConfigValue(rawValue, field) {
  if (!field) {
    return rawValue;
  }

  if (field.type === 'boolean') {
    if (typeof rawValue === 'string') {
      const normalized = rawValue.trim().toLowerCase();
      if (normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on') {
        return true;
      }
      if (normalized === 'false' || normalized === '0' || normalized === 'no' || normalized === 'off') {
        return false;
      }
      throw new Error('must be a boolean');
    }
    return Boolean(rawValue);
  }

  if (field.type === 'integer') {
    const parsed = Number.parseInt(String(rawValue), 10);
    if (!Number.isFinite(parsed)) {
      throw new Error('must be an integer');
    }
    return parsed;
  }

  if (field.type === 'number') {
    const parsed = Number.parseFloat(String(rawValue));
    if (!Number.isFinite(parsed)) {
      throw new Error('must be a number');
    }
    return parsed;
  }

  const value = String(rawValue ?? '').trim();
  if (Array.isArray(field.options) && field.options.length > 0 && !field.options.includes(value)) {
    throw new Error(`must be one of: ${field.options.join(', ')}`);
  }

  return value;
}

export function getConfigValueSchema(pathKey, schema = adminConfigSchema) {
  const field = getFieldDefinition(schema, pathKey);
  if (!field) {
    return null;
  }

  let valueSchema;
  if (field.type === 'boolean') {
    valueSchema = Joi.boolean().truthy('true', '1', 'yes', 'on').falsy('false', '0', 'no', 'off');
  } else if (field.type === 'integer') {
    valueSchema = Joi.number().integer();
  } else if (field.type === 'number') {
    valueSchema = Joi.number();
  } else {
    valueSchema = Joi.string().trim();
  }

  if (Number.isFinite(field.min)) {
    valueSchema = valueSchema.min(field.min);
  }
  if (Number.isFinite(field.max)) {
    valueSchema = valueSchema.max(field.max);
  }
  if (Array.isArray(field.options) && field.options.length > 0) {
    valueSchema = valueSchema.valid(...field.options);
  }

  return valueSchema;
}

export function buildManagedConfigPayload(rawValues, schema = adminConfigSchema) {
  const payload = {};

  for (const [pathKey, rawValue] of Object.entries(rawValues || {})) {
    const field = getFieldDefinition(schema, pathKey);
    if (!field) {
      continue;
    }
    const coercedValue = coerceConfigValue(rawValue, field);
    setNestedValue(payload, pathKey, coercedValue);
  }

  return payload;
}

export function getManagedConfigSnapshot(config, managedPaths = CONFIG_PATHS) {
  const snapshot = {};

  for (const pathKey of managedPaths) {
    setNestedValue(snapshot, pathKey, getValueAtPath(config, pathKey));
  }
  return snapshot;
}

export function getFieldDefinition(schema, pathKey) {
  const [sectionKey, fieldKey] = String(pathKey || '').split('.');
  return schema?.[sectionKey]?.fields?.[fieldKey] || getConfigFieldDefinition(pathKey);
}

export function buildConfigEntry(pathKey, schema, config, defaults) {
  return {
    id: pathKey,
    field: getFieldDefinition(schema, pathKey),
    value: getValueAtPath(config, pathKey),
    defaultValue: getValueAtPath(defaults, pathKey),
  };
}

export const adminConfigDefaults = getManagedConfigSnapshot(DEFAULT_PERSISTED_CONFIG, CONFIG_PATHS);
