import { createBrowserReceiverState } from './state.js';
import { createFocusOrLaunchBraveAction } from './actions/focus-or-launch-brave.js';
import {openUrlOnHost} from './actions/open-url-on-host.js';

export function createBrowser() {
  const state = createBrowserReceiverState();
  const focusOrLaunchBrave = createFocusOrLaunchBraveAction(state);

  return {
    focusOrLaunchBrave,
    openUrlOnHost,
  };
}
