import {jest} from '@jest/globals';

jest.unstable_mockModule('qrcode', () => ({
  default: {toFile: jest.fn(async () => {})},
}));

const {createQrOverlayXWayland} = await import('../../server/services/overlay/createQrOverlayXWayland.js');

describe('native X11/XWayland QR overlay', () => {
  it('delegates hover to the helper and updates the existing process', async () => {
    const client = {
      show: jest.fn(),
      hide: jest.fn(),
      update: jest.fn(),
      close: jest.fn(),
      getState: jest.fn(() => 'visible'),
      process: {once: jest.fn()},
    };
    const createClient = jest.fn(() => client);
    const services = {
      getConfig: () => ({qrOverlay: {
        enabled: true, size: 175, margin: 12, topOffsetPx: 8,
        hoverShowDelayMs: 900, autoHideOnHover: true,
      }}),
      getSystem: () => ({getScreenInfo: async () => ({width: 1920, height: 1080})}),
      getUrls: () => ({entryUrl: 'http://example.test/session'}),
    };

    const overlay = await createQrOverlayXWayland(services, {
      access: async () => {},
      helperPath: '/app/overlay',
      createClient,
      log: {warn: jest.fn()},
    });
    await overlay.show();

    expect(overlay.managesHover).toBe(true);
    expect(overlay.getBounds()).toEqual({x: 1733, y: 20, width: 175, height: 175});
    expect(createClient).toHaveBeenCalledWith(expect.objectContaining({
      x: 1733, y: 20, size: 175, showDelayMs: 900, autoHide: true,
    }));

    await overlay.update();
    expect(client.update).toHaveBeenCalledWith(expect.objectContaining({
      x: 1733, y: 20, size: 175, showDelayMs: 900, autoHide: true,
    }));
  });
});
