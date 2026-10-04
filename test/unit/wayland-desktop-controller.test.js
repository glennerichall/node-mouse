import {jest} from '@jest/globals';

import {createWaylandDesktopController} from '../../server/services/desktop/wayland/createWaylandDesktopController.js';

describe('Wayland desktop controller', () => {
  function createBackend(status = {status: 'ready'}) {
    return {
      authorize: jest.fn(), close: jest.fn(), moveRelative: jest.fn(),
      button: jest.fn(), scroll: jest.fn(), key: jest.fn(),
      getStatus: jest.fn(() => status),
    };
  }

  it('sends relative pointer, button and scroll commands', () => {
    const backend = createBackend();
    const desktop = createWaylandDesktopController(backend);

    desktop.moveMouseRelative(4.5, -2);
    desktop.mouseClick('right');
    desktop.scrollMouse(0, 3);

    expect(backend.moveRelative).toHaveBeenCalledWith(4.5, -2);
    expect(backend.button.mock.calls).toEqual([[273, true], [273, false]]);
    expect(backend.scroll).toHaveBeenCalledWith(0, 3);
    expect(desktop.getMousePos()).toEqual({x: 4.5, y: -2});
  });

  it('uses the observed XWayland pointer instead of the synthetic uinput position', () => {
    const backend = createBackend();
    const getPointerPosition = jest.fn(() => ({x: 1870, y: 42}));
    const desktop = createWaylandDesktopController(backend, {getPointerPosition});

    expect(desktop.getHoverMousePos()).toBeNull();
    desktop.moveMouseRelative(4, 3);

    expect(desktop.getHoverMousePos()).toEqual({x: 1874, y: 45});
    expect(getPointerPosition).toHaveBeenCalledTimes(1);
  });

  it('does not invent a hover coordinate when XWayland cannot observe the pointer', () => {
    const desktop = createWaylandDesktopController(createBackend(), {
      getPointerPosition: () => null,
    });

    desktop.moveMouseRelative(1870, 42);

    expect(desktop.getMousePos()).toBeNull();
  });

  it('starts portal consent only after explicit authorization', () => {
    const backend = createBackend({status: 'permission-required'});
    const desktop = createWaylandDesktopController(backend);

    expect(backend.authorize).not.toHaveBeenCalled();
    desktop.authorize();
    expect(backend.authorize).toHaveBeenCalledTimes(1);
  });

  it('maps text, special keys and modifiers to evdev keycodes', () => {
    const backend = createBackend();
    const desktop = createWaylandDesktopController(backend);

    desktop.typeString('A1');
    desktop.keyTap('enter', ['control']);

    expect(backend.key.mock.calls).toEqual([
      [42, true], [30, true], [30, false], [42, false],
      [2, true], [2, false],
      [29, true], [28, true], [28, false], [29, false],
    ]);
  });

  it('publishes capabilities from the helper state and rejects preview capture', () => {
    const backend = createBackend({status: 'permission-required', detail: 'Consent required'});
    const desktop = createWaylandDesktopController(backend);

    expect(desktop.getCapabilities()).toEqual({
      adapter: 'wayland',
      status: 'permission-required',
      pointer: false,
      keyboard: false,
      preview: false,
      reason: 'Consent required',
    });
    expect(() => desktop.screen.capture()).toThrow('PipeWire');
  });
});
