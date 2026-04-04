import { getDom } from './dom.js';
import { createCanvasUI } from '../ui/canvas-ui.js';
import { bindTouchpad } from '../touch/touchpad.js';
import { bindKeyboardPanel } from '../ui/keyboard-panel.js';
import { bindMouseButtons } from '../ui/mouse-buttons.js';
import { bindActionButtons } from '../ui/action-buttons.js';
import { bindConnectionOverlay } from '../ui/connection-overlay.js';
import { bindPreviewStream } from '../preview/preview-stream.js';
import { bindClientNotifications } from '../ui/notifications/bind-client-notifications.js';
import { bindAdminDrawer } from '../ui/admin-drawer.js';
import { bindAdminVersion } from '../ui/admin-version.js';
import { getClientInputConfig } from '../config/client-config.js';
import { getClientHandedness } from '../i18n/index.js';

export function initUi(socket) {
  const dom = getDom();
  const canvasUI = createCanvasUI(dom.touchpad);
  let showRemoteTimer = null;

  const hideRemotes = () => {
    if (!dom.remoteStack) {
      return;
    }
    if (showRemoteTimer) {
      clearTimeout(showRemoteTimer);
      showRemoteTimer = null;
    }
    dom.remoteStack.classList.add('is-hidden');
  };

  const showRemotes = () => {
    if (!dom.remoteStack) {
      return;
    }
    if (showRemoteTimer) {
      clearTimeout(showRemoteTimer);
    }
    showRemoteTimer = window.setTimeout(() => {
      dom.remoteStack.classList.remove('is-hidden');
      showRemoteTimer = null;
    }, 120);
  };

  const preview = bindPreviewStream(socket, dom);
  bindTouchpad(socket, dom.touchpad, {
    onMouseMove: preview.onMouseMoveActivity,
    onInteractionStart: hideRemotes,
    onInteractionEnd: showRemotes,
    getInputConfig: getClientInputConfig,
    getHandedness: getClientHandedness,
  });
  bindKeyboardPanel(socket, dom);
  bindMouseButtons(socket, dom);
  bindActionButtons(socket, dom);
  bindConnectionOverlay(socket, dom.connectionOverlay);
  bindClientNotifications(socket, dom.notificationsRoot);
  bindAdminDrawer({
    app: dom.app,
    touchpad: dom.touchpad,
    scrim: dom.adminDrawerScrim,
    adminPanel: dom.leftMenu,
  });
  bindAdminVersion(dom.adminAppVersion);

  window.addEventListener('resize', canvasUI.resize);
  canvasUI.resize();
}
