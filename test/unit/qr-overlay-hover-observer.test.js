import {jest} from '@jest/globals';

import {
  startQrOverlayHoverObserver,
} from '../../server/init/observers/startQrOverlayHoverObserver.js';

describe('QR overlay hover observer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-03T12:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function createHarness(getMousePos, getHoverMousePos) {
    let suppressed = false;
    const qrOverlay = {
      getBounds: () => ({x: 1700, y: 20, width: 200, height: 200}),
      isVisible: () => true,
      isSuppressed: () => suppressed,
      setSuppressed: jest.fn((next) => { suppressed = next; }),
    };
    const stop = startQrOverlayHoverObserver({
      getDesktopController: () => ({getMousePos, getHoverMousePos}),
      getQrOverlay: () => qrOverlay,
      getConfig: () => ({
        qrOverlay: {
          autoHideOnHover: true,
          hoverEntryMarginPx: 10,
          hoverExitMarginPx: 18,
          hoverShowDelayMs: 1200,
        },
      }),
    });
    return {qrOverlay, stop};
  }

  it('hides in XWayland root coordinates and shows after leaving the exit zone', () => {
    let pointer = {x: 1800, y: 100};
    const {qrOverlay, stop} = createHarness(() => pointer);

    jest.advanceTimersByTime(80);
    expect(qrOverlay.setSuppressed).toHaveBeenLastCalledWith(true);

    pointer = {x: 1500, y: 400};
    jest.advanceTimersByTime(1120);
    expect(qrOverlay.setSuppressed).toHaveBeenLastCalledWith(true);

    jest.advanceTimersByTime(80);
    expect(qrOverlay.setSuppressed).toHaveBeenLastCalledWith(false);
    stop();
  });

  it('keeps the overlay visible when no global pointer coordinate is available', () => {
    const {qrOverlay, stop} = createHarness(() => null);

    jest.advanceTimersByTime(80);

    expect(qrOverlay.setSuppressed).toHaveBeenLastCalledWith(false);
    stop();
  });

  it('uses one coherent Wayland hover position across hide and show', () => {
    let hoverPointer = null;
    const {qrOverlay, stop} = createHarness(
      () => ({x: 1800, y: 100}),
      () => hoverPointer,
    );

    jest.advanceTimersByTime(80);
    expect(qrOverlay.setSuppressed).toHaveBeenLastCalledWith(false);

    hoverPointer = {x: 1800, y: 100};
    jest.advanceTimersByTime(80);
    expect(qrOverlay.setSuppressed).toHaveBeenLastCalledWith(true);

    hoverPointer = {x: 1500, y: 400};
    jest.advanceTimersByTime(1200);
    expect(qrOverlay.setSuppressed).toHaveBeenLastCalledWith(false);

    hoverPointer = {x: 1800, y: 100};
    jest.advanceTimersByTime(80);
    expect(qrOverlay.setSuppressed).toHaveBeenLastCalledWith(true);
    stop();
  });
});
