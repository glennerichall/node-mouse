import {jest} from '@jest/globals';

import {
  loadXWaylandWindowController,
} from '../../server/os/linux/wayland/loadXWaylandWindowController.js';

describe('XWayland window controller loader', () => {
  it('loads the native visibility bridge', () => {
    const bridge = {setVisible: jest.fn(() => true)};
    const loadNative = jest.fn(() => bridge);

    expect(loadXWaylandWindowController({
      bridgePath: '/tmp/xwayland-window.node',
      loadNative,
    })).toBe(bridge);
  });

  it('fails closed when the optional bridge is unavailable', () => {
    const bridge = loadXWaylandWindowController({
      bridgePath: '/missing/xwayland-window.node',
      loadNative: () => { throw new Error('missing'); },
    });

    expect(bridge.setVisible(123, false)).toBe(false);
  });
});
