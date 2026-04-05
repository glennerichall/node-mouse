import { createBrowserReceiverState } from './state.js';
import { createFocusOrLaunchBraveAction } from './actions/createFocusOrLaunchBraveAction.js';
import {openUrlOnHost} from './actions/openUrlOnHost.js';

export function createBrowser() {
  const state = createBrowserReceiverState();
  const focusOrLaunchBrave = createFocusOrLaunchBraveAction(state);

  return {
    focusOrLaunchBrave,
    openUrlOnHost,
  };
}
