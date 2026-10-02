import {jest} from '@jest/globals';

import {loadWayland} from '../../server/services/desktop/wayland/loadWayland.js';

describe('loadWayland', () => {
  function createHelper() {
    return {
      start: jest.fn(),
      stop: jest.fn(),
      send: jest.fn(),
      getStatus: jest.fn(() => ({status: 'permission-required'})),
    };
  }

  it('opens consent when the server was started from an interactive terminal', async () => {
    const helper = createHelper();

    await loadWayland({helperFactory: () => helper, interactive: true});

    expect(helper.start).toHaveBeenCalledTimes(1);
  });

  it('does not open consent during a non-interactive service startup', async () => {
    const helper = createHelper();

    await loadWayland({helperFactory: () => helper, interactive: false});

    expect(helper.start).not.toHaveBeenCalled();
  });
});
