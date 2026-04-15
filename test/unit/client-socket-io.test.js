import {jest} from '@jest/globals';

import {bindSocketWakeReconnect, initSocketIo} from '../../client/core/init-socket-io.js';
import {REMOTE_EVENT_SYSTEM_RELOAD} from '../../utils/remoteCommands.js';

function createMutableDocument(visibilityState = 'visible') {
  const documentRef = new EventTarget();
  documentRef.visibilityState = visibilityState;
  return documentRef;
}

function createTimerHarness() {
  const timers = new Map();
  let nextTimerId = 1;
  return {
    setTimeoutFn: jest.fn((callback, delay) => {
      const id = nextTimerId;
      nextTimerId += 1;
      timers.set(id, {callback, delay});
      return id;
    }),
    clearTimeoutFn: jest.fn((id) => {
      timers.delete(id);
    }),
    runNext() {
      const [id, timer] = timers.entries().next().value;
      timers.delete(id);
      timer.callback();
      return timer.delay;
    },
    get size() {
      return timers.size;
    },
  };
}

describe('client socket io initialization', () => {
  it('uses aggressive reconnection options for mobile wakeups', () => {
    const previousIo = global.io;
    const previousWindow = global.window;
    const socket = {
      on: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      connected: true,
    };
    const sessionStorage = {
      getItem: jest.fn(() => '0'),
      setItem: jest.fn(),
    };

    global.io = jest.fn(() => socket);
    global.window = new EventTarget();
    global.window.sessionStorage = sessionStorage;

    try {
      expect(initSocketIo()).toBe(socket);
      expect(global.io).toHaveBeenCalledWith(expect.objectContaining({
        reconnection: true,
        reconnectionDelay: 250,
        reconnectionDelayMax: 2000,
        timeout: 4000,
      }));
      expect(socket.on).toHaveBeenCalledWith(REMOTE_EVENT_SYSTEM_RELOAD, expect.any(Function));
    } finally {
      global.io = previousIo;
      global.window = previousWindow;
    }
  });

  it('reconnects immediately when the page returns after a long inactive period', () => {
    const windowRef = new EventTarget();
    const documentRef = createMutableDocument('visible');
    const socket = {
      connected: true,
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
    const timers = createTimerHarness();
    let currentTime = 1_000;

    bindSocketWakeReconnect(socket, {
      windowRef,
      documentRef,
      now: () => currentTime,
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
    });

    windowRef.dispatchEvent(new Event('pagehide'));
    currentTime = 8_000;
    windowRef.dispatchEvent(new Event('pageshow'));

    expect(timers.size).toBe(1);
    expect(timers.runNext()).toBe(100);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('does not reconnect an already connected socket after a short inactive period', () => {
    const windowRef = new EventTarget();
    const documentRef = createMutableDocument('visible');
    const socket = {
      connected: true,
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
    const timers = createTimerHarness();
    let currentTime = 1_000;

    bindSocketWakeReconnect(socket, {
      windowRef,
      documentRef,
      now: () => currentTime,
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
    });

    windowRef.dispatchEvent(new Event('pagehide'));
    currentTime = 1_500;
    windowRef.dispatchEvent(new Event('pageshow'));

    expect(timers.size).toBe(0);
    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.connect).not.toHaveBeenCalled();
  });

  it('connects a disconnected socket when the browser reports the network online', () => {
    const windowRef = new EventTarget();
    const documentRef = createMutableDocument('visible');
    const socket = {
      connected: false,
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
    const timers = createTimerHarness();

    bindSocketWakeReconnect(socket, {
      windowRef,
      documentRef,
      setTimeoutFn: timers.setTimeoutFn,
      clearTimeoutFn: timers.clearTimeoutFn,
    });

    windowRef.dispatchEvent(new Event('online'));

    expect(timers.size).toBe(1);
    timers.runNext();
    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });
});
