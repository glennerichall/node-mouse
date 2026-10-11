import {jest} from '@jest/globals';
import {
  bindTouchHapticFeedback,
  triggerHapticFeedback,
} from '../../client/touch/haptic-feedback.js';

function createTouchEvent(target) {
  const event = new Event('touchstart');
  Object.defineProperty(event, 'target', {value: target});
  return event;
}

describe('touch haptic feedback', () => {
  it('vibrates briefly for enabled controls and ignores non-controls', () => {
    const root = new EventTarget();
    const vibrate = jest.fn(() => true);
    bindTouchHapticFeedback(root, {navigatorRef: {vibrate}});

    root.dispatchEvent(createTouchEvent({
      nodeType: 1,
      closest: () => ({getAttribute: () => null}),
    }));
    root.dispatchEvent(createTouchEvent({
      nodeType: 1,
      closest: () => null,
    }));

    expect(vibrate).toHaveBeenCalledTimes(1);
    expect(vibrate).toHaveBeenCalledWith(10);
  });

  it('silently tolerates missing, rejected, and throwing vibration APIs', () => {
    expect(triggerHapticFeedback({})).toBe(false);
    expect(triggerHapticFeedback({vibrate: () => false})).toBe(false);
    expect(triggerHapticFeedback({vibrate: () => {throw new Error('not allowed');}})).toBe(false);
  });
});
