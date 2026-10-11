import {jest} from '@jest/globals';
import {createSocketTouchHandler} from '../../client/touch/touchpad.js';
import {handleTouchEnd} from '../../client/touch/touch-handlers.js';
import {REMOTE_EVENT_MOUSE_CLICK} from '../../utils/remoteCommands.js';

describe('touchpad click haptics', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('gives haptic feedback when a short touchpad tap becomes a mouse click', () => {
    const socket = {emitWithTimestamp: jest.fn()};
    const onHapticFeedback = jest.fn();
    const handler = createSocketTouchHandler(socket, {onHapticFeedback});
    const state = {
      touchStartedAt: 100,
      oneFingerMode: 'move',
      twoFinger: null,
      moved: false,
      dragActive: false,
    };
    jest.spyOn(Date, 'now').mockReturnValue(150);

    handleTouchEnd({touches: [], preventDefault: jest.fn()}, {state, handler});

    expect(onHapticFeedback).toHaveBeenCalledTimes(1);
    expect(socket.emitWithTimestamp).toHaveBeenCalledWith(REMOTE_EVENT_MOUSE_CLICK, {button: 'left'});
  });
});
