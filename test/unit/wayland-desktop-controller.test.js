import {jest} from '@jest/globals';

import {createWaylandDesktopController} from '../../server/services/desktop/wayland/createWaylandDesktopController.js';

describe('Wayland desktop controller', () => {
  function createHelper(status = {status: 'ready'}) {
    return {
      start: jest.fn(),
      send: jest.fn(() => true),
      stop: jest.fn(),
      getStatus: jest.fn(() => status),
    };
  }

  it('sends relative pointer, button and scroll commands', () => {
    const helper = createHelper();
    const desktop = createWaylandDesktopController(helper);

    desktop.moveMouseRelative(4.5, -2);
    desktop.mouseClick('right');
    desktop.scrollMouse(0, 3);

    expect(helper.send.mock.calls.map(([command]) => command)).toEqual([
      'MOVE 4.5 -2',
      'BUTTON 273 1',
      'BUTTON 273 0',
      'SCROLL 0 3',
    ]);
    expect(desktop.getMousePos()).toEqual({x: 4.5, y: -2});
  });

  it('starts portal consent only after explicit authorization', () => {
    const helper = createHelper({status: 'permission-required'});
    const desktop = createWaylandDesktopController(helper);

    expect(helper.start).not.toHaveBeenCalled();
    desktop.authorize();
    expect(helper.start).toHaveBeenCalledTimes(1);
  });

  it('maps text, special keys and modifiers to evdev keycodes', () => {
    const helper = createHelper();
    const desktop = createWaylandDesktopController(helper);

    desktop.typeString('A1');
    desktop.keyTap('enter', ['control']);

    expect(helper.send.mock.calls.map(([command]) => command)).toEqual([
      'KEY 42 1', 'KEY 30 1', 'KEY 30 0', 'KEY 42 0',
      'KEY 2 1', 'KEY 2 0',
      'KEY 29 1', 'KEY 28 1', 'KEY 28 0', 'KEY 29 0',
    ]);
  });

  it('publishes capabilities from the helper state and rejects preview capture', () => {
    const helper = createHelper({status: 'permission-required', detail: 'Consent required'});
    const desktop = createWaylandDesktopController(helper);

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
