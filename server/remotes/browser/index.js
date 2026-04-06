import { createBrowserReceiverState } from './state.js';
import { createFocusOrLaunchBrowserAction } from './actions/createFocusOrLaunchBrowserAction.js';
import {openUrlOnHost} from './actions/openUrlOnHost.js';
import { listBrowsersOnHost } from './listBrowsersOnHost.js';

export function createBrowser() {
  const state = createBrowserReceiverState();
  const focusOrLaunchBrowser = createFocusOrLaunchBrowserAction(state);

  return {
    focusOrLaunchBrowser,
    listBrowsers: listBrowsersOnHost,
    openUrlOnHost,
  };
}
