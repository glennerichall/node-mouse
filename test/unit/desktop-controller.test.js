import {jest} from '@jest/globals';

import {loadDesktopController} from '../../server/services/desktop/loadDesktopController.js';

describe('desktop controller', () => {
  it('loads RobotJS through the selected loader and exposes the desktop contract', async () => {
    const robotJS = {
      getMousePos: jest.fn(() => ({x: 1, y: 2})),
      moveMouse: jest.fn(),
      dragMouse: jest.fn(),
      scrollMouse: jest.fn(),
      mouseClick: jest.fn(),
      mouseToggle: jest.fn(),
      setKeyboardDelay: jest.fn(),
      typeString: jest.fn(),
      keyTap: jest.fn(),
      getScreenSize: jest.fn(() => ({width: 100, height: 80})),
      screen: {capture: jest.fn(() => ({image: Buffer.alloc(0)}))},
    };
    const robotJSLoader = jest.fn(async () => robotJS);

    const desktop = await loadDesktopController({robotJSLoader});

    expect(robotJSLoader).toHaveBeenCalledTimes(1);
    expect(desktop.getMousePos()).toEqual({x: 1, y: 2});
    desktop.moveMouse(10, 20);
    desktop.screen.capture(0, 0, 20, 10);
    expect(robotJS.moveMouse).toHaveBeenCalledWith(10, 20);
    expect(robotJS.screen.capture).toHaveBeenCalledWith(0, 0, 20, 10);
  });
});
