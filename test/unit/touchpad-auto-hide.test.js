import {jest} from '@jest/globals';
import fs from 'node:fs';

import {bindTouchpad} from '../../client/touch/touchpad.js';
import {APP_STATE_REMOTE_AUTO_HIDE} from '../../client/services/app-state/appStateKeys.js';

function createClassList() {
  const classes = new Set();
  return {
    add: (className) => classes.add(className),
    remove: (className) => classes.delete(className),
    contains: (className) => classes.has(className),
  };
}

function createTouchEvent(touches) {
  return {touches, changedTouches: touches, preventDefault: jest.fn()};
}

describe('touchpad remote auto-hide', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('fades the keyboard shortcut bar with the remotes and restores it after movement', () => {
    jest.useFakeTimers();
    const previousWindow = global.window;
    global.window = {
      setTimeout,
      clearTimeout,
    };

    const touchListeners = new Map();
    const touchpad = {
      addEventListener: (name, callback) => touchListeners.set(name, callback),
      getBoundingClientRect: () => ({left: 0, top: 0, width: 300, height: 200}),
    };
    const remoteStack = {classList: createClassList()};
    const keyboardShortcutsBar = {classList: createClassList()};
    const appState = {
      get: (key) => key === APP_STATE_REMOTE_AUTO_HIDE,
      set: jest.fn(),
      subscribeProperty: jest.fn(),
    };
    const services = {
      getTransport: () => ({emit: jest.fn()}),
      getAppState: () => appState,
      getConfigView: () => ({getInputConfig: () => ({})}),
    };

    try {
      bindTouchpad(services, {
        remotes: {
          mouse: {touchpad},
          keyboard: {keyboardShortcutsBar},
        },
        remoteStack,
      });

      touchListeners.get('touchstart')(createTouchEvent([{clientX: 20, clientY: 20}]));
      touchListeners.get('touchmove')(createTouchEvent([{clientX: 35, clientY: 20}]));
      jest.advanceTimersByTime(300);

      expect(remoteStack.classList.contains('is-hidden')).toBe(true);
      expect(keyboardShortcutsBar.classList.contains('is-hidden')).toBe(true);

      touchListeners.get('touchend')(createTouchEvent([]));
      jest.advanceTimersByTime(500);

      expect(remoteStack.classList.contains('is-hidden')).toBe(false);
      expect(keyboardShortcutsBar.classList.contains('is-hidden')).toBe(false);
    } finally {
      global.window = previousWindow;
    }
  });

  it('uses the same dimmed opacity as the other auto-hidden controls', () => {
    const styles = fs.readFileSync(new URL('../../public/styles.css', import.meta.url), 'utf8');

    expect(styles).toMatch(/#keyboard-shortcuts-bar\.is-hidden\s*\{[^}]*opacity:\s*0\.16/s);
  });
});
