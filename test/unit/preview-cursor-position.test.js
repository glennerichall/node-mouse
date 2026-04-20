import {jest} from '@jest/globals';

import {captureAroundCursor} from '../../server/remotes/preview/captureAroundCursor.js';
import {parsePreviewFrame} from '../../client/preview/parse-preview-frame.js';

function createRobot({screenSize, mousePos}) {
  return {
    screenSize,
    getMousePos: () => mousePos,
    screen: {
      capture: jest.fn(() => ({image: 'capture'})),
    },
  };
}

describe('preview cursor position', () => {
  it('keeps cursor at frame center when capture is not clamped', () => {
    const robot = createRobot({
      screenSize: {width: 1920, height: 1080},
      mousePos: {x: 960, y: 540},
    });

    const result = captureAroundCursor(robot, 128, 84, robot.screenSize);

    expect(result).toEqual(expect.objectContaining({
      x: 896,
      y: 498,
      cursorX: 960,
      cursorY: 540,
      cursorFrameX: 64,
      cursorFrameY: 42,
    }));
  });

  it('moves cursor inside the frame when capture is clamped at the top-left screen edge', () => {
    const robot = createRobot({
      screenSize: {width: 1920, height: 1080},
      mousePos: {x: 3, y: 4},
    });

    const result = captureAroundCursor(robot, 128, 84, robot.screenSize);

    expect(result).toEqual(expect.objectContaining({
      x: 0,
      y: 0,
      cursorX: 3,
      cursorY: 4,
      cursorFrameX: 3,
      cursorFrameY: 4,
    }));
  });

  it('moves cursor inside the frame when capture is clamped at the bottom-right screen edge', () => {
    const robot = createRobot({
      screenSize: {width: 1920, height: 1080},
      mousePos: {x: 1919, y: 1079},
    });

    const result = captureAroundCursor(robot, 128, 84, robot.screenSize);

    expect(result).toEqual(expect.objectContaining({
      x: 1792,
      y: 996,
      cursorX: 1919,
      cursorY: 1079,
      cursorFrameX: 127,
      cursorFrameY: 83,
    }));
  });

  it('parses cursor metadata with a center fallback for older frames', () => {
    const rgba = new Uint8ClampedArray(4 * 8 * 6);
    const parsed = parsePreviewFrame({
      width: 8,
      height: 6,
      x: 10,
      y: 20,
      cursorX: 12,
      cursorY: 23,
      cursorFrameX: 2,
      cursorFrameY: 3,
    }, rgba.buffer);

    expect(parsed).toEqual(expect.objectContaining({
      cursorX: 12,
      cursorY: 23,
      cursorFrameX: 2,
      cursorFrameY: 3,
    }));

    const legacyParsed = parsePreviewFrame({
      width: 8,
      height: 6,
      x: 10,
      y: 20,
    }, rgba.buffer);

    expect(legacyParsed).toEqual(expect.objectContaining({
      cursorFrameX: 4,
      cursorFrameY: 3,
    }));
  });
});
