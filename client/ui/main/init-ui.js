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

  const preferenceView = services.getPreferenceView();
  const dom = getDom();
  const {remotes} = dom;
  const canvasUI = createCanvasUI(remotes.mouse.touchpad, preferenceView);
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

  preferenceView.onRemoteVisibilityChange(syncRemoteVisibilityState);

  services.getClientConfig().onChange(syncRemoteVisibilityState);

  syncRemoteVisibilityState();

  window.addEventListener('resize', canvasUI.resize);

  canvasUI.resize();
}
