import { createBrowserReceiverState } from './state.js';
import { createFocusOrLaunchBraveAction } from './actions/focus-or-launch-brave.js';
import {openUrlOnHost} from './actions/open-url-on-host.js';

export function createBrowserReceiver() {
  const state = createBrowserReceiverState();
  const focusOrLaunchBrave = createFocusOrLaunchBraveAction(state);

  return {
    id: 'browser',
    events: ['browser:brave'],
    canHandle(eventName) {
      return eventName === 'browser:brave';
    },
    async handle(eventName) {
      if (eventName !== 'browser:brave') {
        return;
      }
      await focusOrLaunchBrave();
    },
    focusOrLaunchBrave,
    openUrlOnHost,
  };
}
