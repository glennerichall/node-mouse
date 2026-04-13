import {bindAccordion} from './bindAccordion.js';

export function bindRemoteAccordion(remotes) {
  return bindAccordion([
    remotes.browser.root,
    remotes.samsung.root,
    remotes.vlc.root,
    remotes.system.root,
  ]);
}
