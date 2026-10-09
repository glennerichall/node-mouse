import { jest } from '@jest/globals';

import {
  handleTouchEnd,
  handleTouchMove,
  handleTouchStart,
} from '../../client/touch/touch-handlers.js';

function createState() {
  return {
    oneFinger: null,
    oneFingerStart: null,
    oneFingerMode: 'move',
    twoFinger: null,
    moved: false,
    dragActive: false,
    dragEligible: false,
    touchStartedAt: 0,
    lastMoveAt: 0,
  };
}

function createTouchEvent({ touches, changedTouches = touches }) {
  return {
    touches,
    changedTouches,
    preventDefault: jest.fn(),
  };
}

describe('touch handlers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts a drag after a long press and releases it on touch end', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    const state = createState();
    const handler = {
      buttonState: jest.fn(),
      move: jest.fn(),
      scroll: jest.fn(),
      click: jest.fn(),
      flush: jest.fn(),
    };
    const touchpad = {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 300,
        height: 200,
      }),
    };

    nowSpy.mockReturnValue(1000);
    handleTouchStart(createTouchEvent({
      touches: [{ clientX: 20, clientY: 20 }],
    }), { touchpad, state, handler });

    nowSpy.mockReturnValue(1460);
    handleTouchMove(createTouchEvent({
      touches: [{ clientX: 24, clientY: 23 }],
    }), { state, handler });

    expect(handler.buttonState).toHaveBeenCalledWith('left', 'down');
    expect(handler.move).toHaveBeenCalled();

    nowSpy.mockReturnValue(1470);
    handleTouchEnd(createTouchEvent({ touches: [] }), { state, handler });

    expect(handler.buttonState).toHaveBeenLastCalledWith('left', 'up');
    expect(handler.click).not.toHaveBeenCalled();
    expect(handler.flush).toHaveBeenCalled();
  });

  it('does not start a drag when the finger begins moving before the hold delay', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    const state = createState();
    const handler = {
      buttonState: jest.fn(),
      move: jest.fn(),
      scroll: jest.fn(),
      click: jest.fn(),
      flush: jest.fn(),
    };
    const touchpad = {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        width: 300,
        height: 200,
      }),
    };

    nowSpy.mockReturnValue(1000);
    handleTouchStart(createTouchEvent({
      touches: [{ clientX: 20, clientY: 20 }],
    }), { touchpad, state, handler });

    nowSpy.mockReturnValue(1120);
    handleTouchMove(createTouchEvent({
      touches: [{ clientX: 36, clientY: 28 }],
    }), { state, handler });

    nowSpy.mockReturnValue(1500);
    handleTouchMove(createTouchEvent({
      touches: [{ clientX: 48, clientY: 34 }],
    }), { state, handler });

    expect(handler.buttonState).not.toHaveBeenCalled();
    expect(handler.move).toHaveBeenCalled();
  });

  it('applies local speed without acceleration when the client disables it', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    const state = createState();
    const handler = {
      buttonState: jest.fn(), move: jest.fn(), scroll: jest.fn(), click: jest.fn(), flush: jest.fn(),
      getPointerPreferences: () => ({slowSpeed: 2, fastSpeed: 4, acceleration: false}),
    };
    const touchpad = {getBoundingClientRect: () => ({left: 0, top: 0, width: 300, height: 200})};
    nowSpy.mockReturnValue(1000);
    handleTouchStart(createTouchEvent({touches: [{clientX: 20, clientY: 20}]}), {touchpad, state, handler});
    nowSpy.mockReturnValue(1016);
    handleTouchMove(createTouchEvent({touches: [{clientX: 24, clientY: 17}]}), {state, handler});
    expect(handler.move).toHaveBeenCalledWith(8, -6);
  });

  it('uses the fast endpoint of the local curve for fast movement', () => {
    const nowSpy = jest.spyOn(Date, 'now');
    const state = createState();
    const handler = {
      buttonState: jest.fn(), move: jest.fn(), scroll: jest.fn(), click: jest.fn(), flush: jest.fn(),
      getPointerPreferences: () => ({slowSpeed: 1.5, fastSpeed: 4, acceleration: true}),
    };
    const touchpad = {getBoundingClientRect: () => ({left: 0, top: 0, width: 300, height: 200})};
    nowSpy.mockReturnValue(1000);
    handleTouchStart(createTouchEvent({touches: [{clientX: 20, clientY: 20}]}), {touchpad, state, handler});
    nowSpy.mockReturnValue(1010);
    handleTouchMove(createTouchEvent({touches: [{clientX: 30, clientY: 20}]}), {state, handler});

    expect(handler.move).toHaveBeenCalledWith(40, 0);
  });
});
