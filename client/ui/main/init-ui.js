import { getDom } from '../../core/dom.js';
import { createCanvasUI } from './canvas-ui.js';
import { bindTouchpad } from '../../touch/touchpad.js';
import { bindKeyboardPanel } from './keyboard-panel.js';
import { bindMouseButtons } from './mouse-buttons.js';
import { bindActionButtons } from './bindings/bindActionButtons.js';
import { bindConnectionOverlay } from './connection-overlay.js';
import { bindPreviewStream } from '../../preview/preview-stream.js';
import { bindClientNotifications } from './bind-client-notifications.js';
import { bindAdminDrawer } from './bindings/bindAdminDrawer.js';
import { bindAdminVersion } from './bindings/bindAdminVersion.js';
import { bindRemoteAccordion } from './bindings/bindRemoteAccordion.js';
import {applyRemoteVisibilityState} from './applyRemoteVisibilityState.js';

export function initUi(services) {

  services.getI18n().translateRoot(document);

  const dom = getDom();
  const {remotes} = dom;
  const canvasUI = createCanvasUI(remotes.mouse.touchpad, services.getAppState());
  bindRemoteAccordion(services, dom);

  const syncRemoteVisibilityState = () => applyRemoteVisibilityState({
    services,
    dom,
  });

  bindPreviewStream(services, dom);
  bindTouchpad(services, dom);
  bindKeyboardPanel(services, dom);
  bindMouseButtons(services, dom);
  bindActionButtons(services, dom);
  bindConnectionOverlay(services, dom);
  bindClientNotifications(services, dom);
  bindAdminDrawer(services, dom);
  bindAdminVersion(services, dom);

  for (const key of [
    'effective.remote.browser.visible',
    'effective.remote.keyboard.visible',
    'effective.remote.vlc.visible',
    'effective.remote.samsung.visible',
    'effective.remote.preview.visible',
  ]) {
    services.getAppState().subscribeProperty(key, syncRemoteVisibilityState);
  }

  syncRemoteVisibilityState();

  window.addEventListener('resize', canvasUI.resize);

  canvasUI.resize();
}
