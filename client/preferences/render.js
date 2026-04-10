import {
  createBrowserVisibilityRow,
  createRemoteVisibilityRow,
} from './rows.js';

export function renderRemoteVisibilityList(remotesRoot, remotes, t) {
  if (!remotesRoot) {
    return;
  }

  remotesRoot.innerHTML = '';
  for (const remote of remotes) {
    remotesRoot.appendChild(createRemoteVisibilityRow(remote, t));
  }
}

export function renderBrowserVisibilityList(browsersRoot, browsers, t) {
  if (!browsersRoot) {
    return;
  }

  browsersRoot.innerHTML = '';
  for (const browser of browsers) {
    browsersRoot.appendChild(createBrowserVisibilityRow(browser, t));
  }
}
