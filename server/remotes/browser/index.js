import { createBrowserReceiverState } from './state.js';
import { createFocusOrLaunchBrowserAction } from './actions/createFocusOrLaunchBrowserAction.js';
import {openUrlOnHost} from './actions/openUrlOnHost.js';
import { listBrowsersOnHost } from './listBrowsersOnHost.js';

export function createBrowser(osService) {
  const state = createBrowserReceiverState();
  const focusOrLaunchBrowser = createFocusOrLaunchBrowserAction(state, osService);

  return {
    focusOrLaunchBrowser,
    listBrowsers: () => listBrowsersOnHost(osService),
    openUrlOnHost: (url) => openUrlOnHost(osService, url),
  };
}
