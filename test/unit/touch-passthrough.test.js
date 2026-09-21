import {jest} from '@jest/globals';

import {bindTouchPassthrough} from '../../client/touch/bindTouchPassthrough.js';

function createTouchEvent(type, {clientX = 0, clientY = 0} = {}) {
  const event = new Event(type, {cancelable: true});
  const touch = {identifier: 1, clientX, clientY};
  Object.defineProperty(event, 'changedTouches', {value: [touch]});
  Object.defineProperty(event, 'touches', {value: type === 'touchend' ? [] : [touch]});
  return event;
}

describe('bindTouchPassthrough', () => {
  const previousDocument = global.document;

  beforeEach(() => {
    jest.useFakeTimers();
    global.document = new EventTarget();
  });

  afterEach(() => {
    global.document = previousDocument;
    jest.useRealTimers();
  });

  it('does not suppress a later tap when a passthrough gesture produced no click', () => {
    const button = new EventTarget();
    bindTouchPassthrough([button], new EventTarget());

    button.dispatchEvent(createTouchEvent('touchstart'));
    document.dispatchEvent(createTouchEvent('touchmove', {clientX: 20}));
    document.dispatchEvent(createTouchEvent('touchend', {clientX: 20}));
    jest.advanceTimersByTime(600);

    const nextClick = new Event('click', {cancelable: true});
    button.dispatchEvent(nextClick);

    expect(nextClick.defaultPrevented).toBe(false);
  });
});
