import {jest} from '@jest/globals';

import {loadUInput} from '../../server/services/desktop/wayland/loadUInput.js';

describe('loadUInput', () => {
  it('opens the native bridge and exposes the uinput adapter', async () => {
    const bridge = {
      open: jest.fn(), close: jest.fn(), moveRelative: jest.fn(),
      button: jest.fn(), scroll: jest.fn(), key: jest.fn(),
    };
    const desktop = await loadUInput({bridgeLoader: () => bridge});
    expect(bridge.open).toHaveBeenCalledTimes(1);
    expect(desktop.getCapabilities()).toEqual(expect.objectContaining({
      adapter: 'wayland-uinput', status: 'ready', pointer: true, keyboard: true,
    }));
    desktop.moveMouseRelative(2, -1);
    desktop.mouseClick('right');
    desktop.keyTap('enter');
    expect(bridge.moveRelative).toHaveBeenCalledWith(2, -1);
    expect(bridge.button.mock.calls).toEqual([[273, 1], [273, 0]]);
    expect(bridge.key.mock.calls).toEqual([[28, 1], [28, 0]]);
  });

  it('keeps the server available when /dev/uinput cannot open', async () => {
    const error = Object.assign(new Error('denied'), {code: 'UINPUT_PERMISSION_DENIED'});
    const bridge = {open: jest.fn(() => { throw error; }), close: jest.fn()};
    const desktop = await loadUInput({bridgeLoader: () => bridge});
    expect(desktop.getCapabilities()).toEqual(expect.objectContaining({
      status: 'permission-denied', pointer: false, keyboard: false,
    }));
  });
});
