import {jest} from '@jest/globals';

import {loadWaylandPortal} from '../../server/services/desktop/wayland/loadWaylandPortal.js';

describe('loadWaylandPortal', () => {
  function createHelper() {
    return {
      start: jest.fn(), stop: jest.fn(), send: jest.fn(),
      getStatus: jest.fn(() => ({status: 'permission-required'})),
    };
  }

  it('opens consent from an interactive terminal', async () => {
    const helper = createHelper();
    const desktop = await loadWaylandPortal({helperFactory: () => helper, interactive: true});
    expect(helper.start).toHaveBeenCalledTimes(1);
    expect(desktop.getCapabilities().adapter).toBe('wayland-portal');
  });

  it('does not open consent during service startup', async () => {
    const helper = createHelper();
    await loadWaylandPortal({helperFactory: () => helper, interactive: false});
    expect(helper.start).not.toHaveBeenCalled();
  });
});
