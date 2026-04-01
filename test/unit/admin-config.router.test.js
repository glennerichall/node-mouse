import {
  buildManagedConfigPayload,
  coerceConfigValue,
} from '../../server/connection/api/admin-config.shared.js';
import {DEFAULT_CONFIG} from '../../server/init/config/defaultConfig.js';

describe('admin config router helpers', () => {
  it('coerces booleans, integers and numbers', () => {
    expect(coerceConfigValue(true, {type: 'boolean'})).toBe(true);
    expect(coerceConfigValue('42', {type: 'integer'})).toBe(42);
    expect(coerceConfigValue('1.75', {type: 'number'})).toBeCloseTo(1.75);
    expect(coerceConfigValue('  info  ', {type: 'string'})).toBe('info');
    expect(coerceConfigValue('warn', {type: 'string', options: ['info', 'warn', 'error']})).toBe('warn');
  });

  it('rejects values outside the allowed options', () => {
    expect(() => coerceConfigValue('verbose', {type: 'string', options: ['info', 'warn', 'error']})).toThrow(
      'must be one of: info, warn, error',
    );
  });

  it('builds a nested payload from flat values', () => {
    const payload = buildManagedConfigPayload({
      'input.mouseSpeed': '1.5',
      'notifications.client': true,
      'logging.level': 'debug',
    }, {
      input: {
        fields: {
          mouseSpeed: {type: 'number'},
        },
      },
      notifications: {
        fields: {
          client: {type: 'boolean'},
        },
      },
      logging: {
        fields: {
          level: {type: 'string'},
        },
      },
    });

    expect(payload).toEqual({
      input: {
        mouseSpeed: 1.5,
      },
      notifications: {
        client: true,
      },
      logging: {
        level: 'debug',
      },
    });
  });

  it('exposes the default logging values in the shared defaults source', () => {
    expect(DEFAULT_CONFIG.logging).toEqual({
      level: 'info',
      format: 'json',
    });
  });

  it('treats null as a delete signal at the API contract level', () => {
    expect(null).toBeNull();
  });
});
