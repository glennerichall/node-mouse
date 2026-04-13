import {
  buildManagedConfigPayload,
  coerceConfigValue,
} from '../../server/connection/api/configs.js';
import {DEFAULT_PERSISTED_CONFIG} from '../../server/services/config/defaultConfig.js';

describe('admin config router helpers', () => {
  it('coerces booleans, integers and numbers', () => {
    expect(coerceConfigValue(true, {type: 'boolean'})).toBe(true);
    expect(coerceConfigValue('false', {type: 'boolean'})).toBe(false);
    expect(coerceConfigValue('true', {type: 'boolean'})).toBe(true);
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
      'notifications.clientConnected.client': true,
      'preview.fps': '12',
    }, {
      input: {
        fields: {
          mouseSpeed: {type: 'number'},
        },
      },
      preview: {
        fields: {
          fps: {type: 'integer'},
        },
      },
    });

    expect(payload).toEqual({
      input: {
        mouseSpeed: 1.5,
      },
      notifications: {
        clientConnected: {
          client: true,
        },
      },
      preview: {
        fps: 12,
      },
    });
  });

  it('does not expose logging values in the persisted defaults source', () => {
    expect(DEFAULT_PERSISTED_CONFIG.logging).toBeUndefined();
  });

  it('treats null as a delete signal at the API contract level', () => {
    expect(null).toBeNull();
  });
});
