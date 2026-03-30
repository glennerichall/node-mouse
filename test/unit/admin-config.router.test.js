import {
  buildManagedConfigPayload,
  coerceConfigValue,
} from '../../server/connection/api/admin-config.router.js';

describe('admin config router helpers', () => {
  it('coerces booleans, integers and numbers', () => {
    expect(coerceConfigValue(true, {type: 'boolean'})).toBe(true);
    expect(coerceConfigValue('42', {type: 'integer'})).toBe(42);
    expect(coerceConfigValue('1.75', {type: 'number'})).toBeCloseTo(1.75);
    expect(coerceConfigValue('  info  ', {type: 'string'})).toBe('info');
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
});
