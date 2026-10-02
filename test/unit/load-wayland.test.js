import {jest} from '@jest/globals';

import {loadWayland} from '../../server/services/desktop/wayland/loadWayland.js';

describe('loadWayland', () => {
  it('loads uinput by default', async () => {
    const controller = {};
    const uinputLoader = jest.fn(async () => controller);
    const portalLoader = jest.fn();

    await expect(loadWayland({uinputLoader, portalLoader})).resolves.toBe(controller);
    expect(uinputLoader).toHaveBeenCalledTimes(1);
    expect(portalLoader).not.toHaveBeenCalled();
  });

  it('keeps the portal strategy selectable', async () => {
    const controller = {};
    const uinputLoader = jest.fn();
    const portalLoader = jest.fn(async () => controller);

    await expect(loadWayland({strategy: 'portal', uinputLoader, portalLoader})).resolves.toBe(controller);
    expect(portalLoader).toHaveBeenCalledTimes(1);
    expect(uinputLoader).not.toHaveBeenCalled();
  });

  it('rejects an unknown strategy explicitly', async () => {
    await expect(loadWayland({strategy: 'unknown'})).rejects.toThrow('Expected uinput or portal');
  });
});
