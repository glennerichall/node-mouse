import {jest} from '@jest/globals';

import {bindRepeatingButton} from '../../client/ui/main/bindings/bindSamsungRemoteButtons.js';

function createPointerEvent(type, {clientX = 0, clientY = 0} = {}) {
  const event = new Event(type, {cancelable: true});
  Object.defineProperty(event, 'button', {value: 0});
  Object.defineProperty(event, 'pointerId', {value: 1});
  Object.defineProperty(event, 'clientX', {value: clientX});
  Object.defineProperty(event, 'clientY', {value: clientY});
  return event;
}

function createTouchEvent(type, {identifier = 12, clientX = 0, clientY = 0} = {}) {
  const event = new Event(type, {cancelable: true});
  const touch = {identifier, clientX, clientY};
  Object.defineProperty(event, 'changedTouches', {value: [touch]});
  Object.defineProperty(event, 'touches', {value: [touch]});
  return event;
}

describe('bindRepeatingButton', () => {
  let previousWindow;
  let previousDocument;

  beforeEach(() => {
    jest.useFakeTimers();
    previousWindow = global.window;
    previousDocument = global.document;

    global.window = new EventTarget();
    global.window.setTimeout = setTimeout;
    global.window.clearTimeout = clearTimeout;
    global.window.setInterval = setInterval;
    global.window.clearInterval = clearInterval;

    global.document = new EventTarget();
    global.document.hidden = false;
  });

  afterEach(() => {
    global.window = previousWindow;
    global.document = previousDocument;
    jest.useRealTimers();
  });

  it('emits once for a short pointer press', () => {
    const button = new EventTarget();
    button.disabled = false;
    button.hidden = false;
    button.setPointerCapture = jest.fn();
    button.releasePointerCapture = jest.fn();
    const emit = jest.fn();

    bindRepeatingButton(button, emit, {
      holdDelayMs: 100,
      repeatIntervalMs: 50,
    });

    button.dispatchEvent(createPointerEvent('pointerdown'));
    button.dispatchEvent(createPointerEvent('pointerup'));
    jest.advanceTimersByTime(200);

    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('repeats after the hold delay until release', () => {
    const button = new EventTarget();
    button.disabled = false;
    button.hidden = false;
    button.setPointerCapture = jest.fn();
    button.releasePointerCapture = jest.fn();
    const emit = jest.fn();

    bindRepeatingButton(button, emit, {
      holdDelayMs: 100,
      repeatIntervalMs: 50,
    });

    button.dispatchEvent(createPointerEvent('pointerdown'));
    expect(emit).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    expect(emit).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(150);
    expect(emit).toHaveBeenCalledTimes(5);

    button.dispatchEvent(createPointerEvent('pointerup'));
    jest.advanceTimersByTime(150);

    expect(emit).toHaveBeenCalledTimes(5);
  });

  it('cancels repeating when a touch move becomes a passthrough gesture', () => {
    const button = new EventTarget();
    button.disabled = false;
    button.hidden = false;
    button.setPointerCapture = jest.fn();
    button.releasePointerCapture = jest.fn();
    const emit = jest.fn();

    bindRepeatingButton(button, emit, {
      holdDelayMs: 100,
      repeatIntervalMs: 50,
      moveCancelThresholdPx: 10,
    });

    button.dispatchEvent(createTouchEvent('touchstart', {clientX: 0, clientY: 0}));
    button.dispatchEvent(createPointerEvent('pointerdown', {clientX: 0, clientY: 0}));
    button.dispatchEvent(createTouchEvent('touchmove', {clientX: 12, clientY: 0}));
    jest.advanceTimersByTime(250);

    expect(emit).toHaveBeenCalledTimes(1);
  });
});
