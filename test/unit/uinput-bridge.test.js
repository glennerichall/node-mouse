import {jest} from '@jest/globals';

import {loadUInputBridge} from '../../server/os/linux/wayland/loadUInputBridge.js';

describe('uinput native bridge loader', () => {
  it('loads the configured native addon lazily', () => {
    const bridge = {};
    const loadNative = jest.fn(() => bridge);
    expect(loadUInputBridge({bridgePath: '/tmp/uinput.node', loadNative})).toBe(bridge);
    expect(loadNative).toHaveBeenCalledWith('/tmp/uinput.node');
  });

  it('reports an actionable build command when the addon cannot load', () => {
    expect(() => loadUInputBridge({
      bridgePath: '/missing/uinput.node',
      loadNative: () => { throw new Error('missing'); },
    })).toThrow('npm run build:uinput');
  });
});
