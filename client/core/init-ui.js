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
import {
  getClientBrowserConfig,
  getClientInputConfig,
  getClientKeyboardConfig,
  getClientPreviewConfig,
  onClientConfigChange,
} from '../config/client-config.js';
import {
  getClientHandedness,
  getClientRemoteAutoHide,
  getClientRemoteVisibility,
  initClientRemoteAutoHide,
  initClientRemoteVisibilityState,
  onClientRemoteAutoHideChange,
  onClientRemoteVisibilityChange,
} from '../i18n/index.js';

export function initUi(socket) {
  const dom = getDom();
  const canvasUI = createCanvasUI(dom.touchpad);
  initClientRemoteAutoHide();
  initClientRemoteVisibilityState();
  let hideRemoteTimer = null;
  let showRemoteTimer = null;
  const REMOTE_HIDE_DELAY_MS = 300;
  const SHOW_REMOTE_DELAY = 500;

  const applyRemoteVisibilityState = () => {
    const browserVisible = getClientBrowserConfig().enabled !== false
      && getClientRemoteVisibility('browser', true);
    const keyboardVisible = getClientKeyboardConfig().enabled !== false
      && getClientRemoteVisibility('keyboard', true);
    const samsungVisible = getClientRemoteVisibility('samsung', true);
    const previewVisible = getClientPreviewConfig().enabled !== false
      && getClientRemoteVisibility('preview', true);

    if (dom.browserShortcuts) {
      dom.browserShortcuts.hidden = !browserVisible;
    }
    dom.app?.classList.toggle('keyboard-remote-hidden', !keyboardVisible);
    if (dom.menu) {
      dom.menu.style.display = keyboardVisible ? '' : 'none';
    }
    if (dom.keyboardShortcutsBar) {
      dom.keyboardShortcutsBar.style.display = keyboardVisible ? '' : 'none';
    }
    if (dom.keyboardPanel) {
      if (!keyboardVisible) {
        dom.keyboardPanel.classList.add('hidden');
      }
      dom.keyboardPanel.style.display = keyboardVisible ? '' : 'none';
    }
    if (dom.tvControls) {
      dom.tvControls.hidden = !samsungVisible;
    }
    if (dom.cursorPreview) {
      dom.cursorPreview.hidden = !previewVisible;
      if (!previewVisible) {
        dom.cursorPreview.classList.remove('is-visible');
      }
    }
  };

  const hideRemotes = (interactionKind = 'move') => {
    if (!dom.remoteStack) {
      return;
    }
    if (interactionKind !== 'move') {
      return;
    }
    if (!getClientRemoteAutoHide()) {
      dom.remoteStack.classList.remove('is-hidden');
      dom.scrollZoneIndicator?.classList.remove('is-hidden');
      return;
    }
    if (hideRemoteTimer) {
      return;
    }
    if (showRemoteTimer) {
      clearTimeout(showRemoteTimer);
      showRemoteTimer = null;
    }
    hideRemoteTimer = window.setTimeout(() => {
      dom.remoteStack.classList.add('is-hidden');
      dom.scrollZoneIndicator?.classList.add('is-hidden');
      hideRemoteTimer = null;
    }, REMOTE_HIDE_DELAY_MS);
  };

  const showRemotes = () => {
    if (!dom.remoteStack) {
      return;
    }
    if (hideRemoteTimer) {
      clearTimeout(hideRemoteTimer);
      hideRemoteTimer = null;
    }
    if (showRemoteTimer) {
      clearTimeout(showRemoteTimer);
    }
    showRemoteTimer = window.setTimeout(() => {
      dom.remoteStack.classList.remove('is-hidden');
      dom.scrollZoneIndicator?.classList.remove('is-hidden');
      showRemoteTimer = null;
    }, SHOW_REMOTE_DELAY);
  };

  const applyRemoteAutoHideState = () => {
    if (!getClientRemoteAutoHide()) {
      if (hideRemoteTimer) {
        clearTimeout(hideRemoteTimer);
        hideRemoteTimer = null;
      }
      if (showRemoteTimer) {
        clearTimeout(showRemoteTimer);
        showRemoteTimer = null;
      }
      dom.remoteStack?.classList.remove('is-hidden');
      dom.scrollZoneIndicator?.classList.remove('is-hidden');
    }
  };

  const preview = bindPreviewStream(socket, dom);
  bindTouchpad(socket, dom.touchpad, {
    onMouseMove: preview.onMouseMoveActivity,
    onMovementStart: hideRemotes,
    onInteractionEnd: showRemotes,
    getInputConfig: getClientInputConfig,
    getHandedness: getClientHandedness,
  });
  bindKeyboardPanel(socket, dom, {
    setPreviewActive: preview.setKeyboardPreviewActive,
  });
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
  onClientRemoteAutoHideChange(applyRemoteAutoHideState);
  onClientRemoteVisibilityChange(applyRemoteVisibilityState);
  onClientConfigChange(applyRemoteVisibilityState);
  applyRemoteAutoHideState();
  applyRemoteVisibilityState();

  window.addEventListener('resize', canvasUI.resize);
  canvasUI.resize();
}
