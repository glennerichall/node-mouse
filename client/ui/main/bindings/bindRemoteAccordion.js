import {bindAccordion} from './bindAccordion.js';
import {bindTouchPassthrough} from '../../../touch/bindTouchPassthrough.js';

export function bindRemoteAccordion(services, dom) {
  const {remotes} = dom;
  const panels = [
    remotes.browser.root,
    remotes.samsung.root,
    remotes.vlc.root,
    remotes.system.root,
  ];

  bindTouchPassthrough(
    panels
      .filter(Boolean)
      .map((panel) => panel.querySelector('.remote-panel-toggle')),
    remotes.mouse.touchpad,
  );

  return bindAccordion(panels, {
    appState: services.getAppState(),
  });
}
