import { getDom } from './dom.js';
import { createCanvasUI } from '../ui/canvas-ui.js';
import { bindTouchpad } from '../touch/touchpad.js';
import { bindKeyboardPanel } from '../ui/keyboard-panel.js';
import { bindMouseButtons } from '../ui/mouse-buttons.js';
import { bindActionButtons } from '../ui/bindings/bindActionButtons.js';
import { bindConnectionOverlay } from '../ui/connection-overlay.js';
import { bindPreviewStream } from '../preview/preview-stream.js';
import { bindClientNotifications } from '../ui/notifications/bind-client-notifications.js';
import { bindAdminDrawer } from '../ui/bindings/bindAdminDrawer.js';
import { bindAdminVersion } from '../ui/bindings/bindAdminVersion.js';
import { bindRemoteAccordion } from '../ui/bindings/bindRemoteAccordion.js';
export function initUi(services) {
  const transport = services.getTransport();
  const preferenceView = services.getPreferenceView();
  const clientConfig = services.getClientConfig();
  const dom = getDom();
  const canvasUI = createCanvasUI(dom.touchpad, preferenceView);
  const remoteAccordion = bindRemoteAccordion(dom);
  let hideRemoteTimer = null;
  let showRemoteTimer = null;
  const REMOTE_HIDE_DELAY_MS = 300;
  const SHOW_REMOTE_DELAY = 500;

  const applyRemoteVisibilityState = () => {
    const configView = services.getConfigView();
    const browserVisible = configView.getBrowserConfig().enabled !== false
      && preferenceView.getRemoteVisibility('browser', true);
    const keyboardVisible = configView.getKeyboardConfig().enabled !== false
      && preferenceView.getRemoteVisibility('keyboard', true);
    const vlcVisible = configView.getVlcConfig().enabled !== false
      && preferenceView.getRemoteVisibility('vlc', true);
    const samsungVisible = preferenceView.getRemoteVisibility('samsung', true);
    const previewVisible = configView.getPreviewConfig().enabled !== false
      && preferenceView.getRemoteVisibility('preview', true);

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
    if (dom.vlcControls) {
      dom.vlcControls.hidden = !vlcVisible;
    }
    if (dom.cursorPreview) {
      dom.cursorPreview.hidden = !previewVisible;
      if (!previewVisible) {
        dom.cursorPreview.classList.remove('is-visible');
      }
    }
    remoteAccordion.syncVisiblePanels();
  };

  const hideRemotes = (interactionKind = 'move') => {
    if (!dom.remoteStack) {
      return;
    }
    if (interactionKind !== 'move') {
      return;
    }
    if (!preferenceView.getRemoteAutoHide()) {
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
    if (!preferenceView.getRemoteAutoHide()) {
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

  const preview = bindPreviewStream(transport, dom, {
    clientConfig,
    getConfigView: services.getConfigView,
    preferenceView,
  });
  bindTouchpad(transport, dom.touchpad, {
    onMouseMove: preview.onMouseMoveActivity,
    onMovementStart: hideRemotes,
    onInteractionEnd: showRemotes,
    getInputConfig: () => services.getConfigView().getInputConfig(),
    getHandedness: () => preferenceView.getHandedness(),
  });
  bindKeyboardPanel(transport, dom, {
    setPreviewActive: preview.setKeyboardPreviewActive,
  });
  bindMouseButtons(transport, dom);
  bindActionButtons(transport, dom, services);
  bindConnectionOverlay(transport, dom.connectionOverlay, services.getI18n());
  bindClientNotifications(services, dom.notificationsRoot);
  bindAdminDrawer({
    app: dom.app,
    touchpad: dom.touchpad,
    scrim: dom.adminDrawerScrim,
    adminPanel: dom.leftMenu,
  });
  bindAdminVersion(dom.adminAppVersion, services.getI18n());
  preferenceView.onRemoteAutoHideChange(applyRemoteAutoHideState);
  preferenceView.onRemoteVisibilityChange(applyRemoteVisibilityState);
  services.getClientConfig().onChange(applyRemoteVisibilityState);
  applyRemoteAutoHideState();
  applyRemoteVisibilityState();

  window.addEventListener('resize', canvasUI.resize);
  canvasUI.resize();
}
