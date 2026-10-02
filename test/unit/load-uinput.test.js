import {jest} from '@jest/globals';

import {loadUInput} from '../../server/services/desktop/wayland/loadUInput.js';

describe('loadUInput', () => {
  it('starts the helper immediately and exposes the uinput adapter', async () => {
    const helper = {
      start: jest.fn(), stop: jest.fn(), send: jest.fn(),
      getStatus: jest.fn(() => ({status: 'ready'})),
    };
    const desktop = await loadUInput({helperFactory: () => helper});
    expect(helper.start).toHaveBeenCalledTimes(1);
    expect(desktop.getCapabilities()).toEqual(expect.objectContaining({
      adapter: 'wayland-uinput', status: 'ready', pointer: true, keyboard: true,
    }));
  });
});
