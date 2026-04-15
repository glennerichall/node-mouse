import {
  createBrowserVisibilityRow,
  createRemoteVisibilityRow,
} from './rows.js';

export function renderRemoteVisibilityList(remotesRoot, remotes, t, services) {
  if (!remotesRoot) {
    return;
  }

  remotesRoot.innerHTML = '';
  for (const remote of remotes) {
    remotesRoot.appendChild(createRemoteVisibilityRow(remote, t, services));
  }
}

export function renderBrowserVisibilityList(browsersRoot, browsers, t, services) {
  if (!browsersRoot) {
    return;
  }

  browsersRoot.innerHTML = '';
  for (const browser of browsers) {
    browsersRoot.appendChild(createBrowserVisibilityRow(browser, t, services));
  }
}
