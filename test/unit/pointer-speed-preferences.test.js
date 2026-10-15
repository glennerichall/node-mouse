import {APP_STATE_POINTER_FAST_SPEED} from '../../client/services/app-state/appStateKeys.js';
import {APP_STATE_DEFINITIONS} from '../../client/services/app-state/stateDefinitions.js';

describe('pointer speed preferences', () => {
  it('allows fast touch gain up to 20 while preserving the default', () => {
    const definition = APP_STATE_DEFINITIONS[APP_STATE_POINTER_FAST_SPEED];

    expect(definition.defaultValue).toBe(3);
    expect(definition.normalize(20)).toBe(20);
    expect(definition.normalize(25)).toBe(20);
  });
});
