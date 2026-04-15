import {bindAccordion} from './bindAccordion.js';

export function bindRemoteAccordion(services, dom) {
  const {remotes} = dom;

  return bindAccordion([
    remotes.browser.root,
    remotes.samsung.root,
    remotes.vlc.root,
    remotes.system.root,
  ], {
    appState: services.getAppState(),
  });
}
