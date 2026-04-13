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
import {applyRemoteVisibilityState} from '../ui/applyRemoteVisibilityState.js';

export function initUi(services) {

  services.getI18n().translateRoot(document);

  const transport = services.getTransport();
  const preferenceView = services.getPreferenceView();
  const clientConfig = services.getClientConfig();
  const dom = getDom();
  const {remotes} = dom;
  const canvasUI = createCanvasUI(remotes.mouse.touchpad, preferenceView);
  const remoteAccordion = bindRemoteAccordion(remotes);

  let hideRemoteTimer = null;
  let showRemoteTimer = null;
  const REMOTE_HIDE_DELAY_MS = 300;
  const SHOW_REMOTE_DELAY = 500;

  const syncRemoteVisibilityState = () => applyRemoteVisibilityState({
    services,
    accordion: remoteAccordion,
    dom,
  });

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

  const preview = bindPreviewStream(transport, remotes.preview, {
    clientConfig,
    getConfigView: services.getConfigView,
    preferenceView,
  });

  bindTouchpad(transport, remotes.mouse.touchpad, {
    onMouseMove: preview.onMouseMoveActivity,
    onMovementStart: hideRemotes,
    onInteractionEnd: showRemotes,
    getInputConfig: () => services.getConfigView().getInputConfig(),
    getHandedness: () => preferenceView.getHandedness(),
  });

  bindKeyboardPanel(transport, remotes.keyboard, {
    setPreviewActive: preview.setKeyboardPreviewActive,
  });

  bindMouseButtons(transport, remotes.mouse);

  bindActionButtons(transport, remotes, services);

  bindConnectionOverlay(transport, dom.connectionOverlay, services.getI18n());

  bindClientNotifications(services, dom.notificationsRoot);

  bindAdminDrawer({
    app: dom.app,
    touchpad: remotes.mouse.touchpad,
    scrim: dom.adminDrawerScrim,
    adminPanel: dom.leftMenu,
  });

  bindAdminVersion(remotes.admin.adminAppVersion, services.getI18n());

  preferenceView.onRemoteAutoHideChange(applyRemoteAutoHideState);

  preferenceView.onRemoteVisibilityChange(syncRemoteVisibilityState);

  services.getClientConfig().onChange(syncRemoteVisibilityState);

  applyRemoteAutoHideState();

  syncRemoteVisibilityState();

  window.addEventListener('resize', canvasUI.resize);

  canvasUI.resize();
}
