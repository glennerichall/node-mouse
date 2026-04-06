import { emitWithTimestamp } from '../core/socket-emit.js';
import {
  getClientSamsungConfig,
  getClientSystemConfig,
  onClientConfigChange,
} from '../config/client-config.js';
import {
  REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT,
  REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER,
  REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT,
  REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER,
  REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN,
  REMOTE_EVENT_ADMIN_SERVICE_RESTART,
  REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY,
  REMOTE_EVENT_ADMIN_UPDATE_CHECK,
  REMOTE_EVENT_ADMIN_UPDATE_INSTALL,
  REMOTE_EVENT_BROWSER_BRAVE,
  REMOTE_EVENT_KEYBOARD_KEY,
  REMOTE_EVENT_SAMSUNG_ENTER,
  REMOTE_EVENT_SAMSUNG_INPUT,
  REMOTE_EVENT_SAMSUNG_OFF,
  REMOTE_EVENT_SAMSUNG_ON,
  REMOTE_EVENT_SAMSUNG_PC_INPUT,
  REMOTE_EVENT_SAMSUNG_VOL_DOWN,
  REMOTE_EVENT_SAMSUNG_VOL_UP,
} from '../../utils/shared/remoteCommands.js';

function bindBrowserRemoteButtons(
  socket,
  {
    btnOpenBrave,
    btnBrowserBack,
    btnBrowserForward,
    btnPrevTab,
    btnNextTab,
    btnNewTab,
    btnCloseTab,
    btnAddressBar,
    btnHardReload,
    btnFullscreen,
  },
) {
  btnOpenBrave.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_BROWSER_BRAVE));
  btnBrowserBack.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key: 'left', modifiers: ['alt'] }),
  );
  btnBrowserForward.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key: 'right', modifiers: ['alt'] }),
  );
  btnPrevTab.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key: 'tab', modifiers: ['control', 'shift'] }),
  );
  btnNextTab.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key: 'tab', modifiers: ['control'] }),
  );
  btnNewTab.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key: 't', modifiers: ['control'] }),
  );
  btnCloseTab.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key: 'w', modifiers: ['control'] }),
  );
  btnAddressBar.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key: 'l', modifiers: ['control'] }),
  );
  btnHardReload.addEventListener('click', () =>
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key: 'f5', modifiers: ['control'] }),
  );
  btnFullscreen.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key: 'f11' }));
}

function bindSamsungRemoteButtons(
  socket,
  {
    tvControls,
    btnSamsungOn,
    btnSamsungOff,
    btnSamsungVolUp,
    btnSamsungVolDown,
    btnSamsungInput,
    btnSamsungEnter,
    btnSamsungPcInput,
  },
) {
  const syncSamsungVisibility = () => {
    if (!tvControls) {
      return;
    }
    const samsungConfig = getClientSamsungConfig();
    tvControls.hidden = !samsungConfig.enabled;
  };

  btnSamsungOn.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_SAMSUNG_ON));
  btnSamsungOff.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_SAMSUNG_OFF));
  btnSamsungVolUp.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_SAMSUNG_VOL_UP));
  btnSamsungVolDown.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_SAMSUNG_VOL_DOWN));
  btnSamsungInput.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_SAMSUNG_INPUT));
  btnSamsungEnter.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_SAMSUNG_ENTER));
  btnSamsungPcInput.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_SAMSUNG_PC_INPUT));
  syncSamsungVisibility();
  onClientConfigChange(syncSamsungVisibility);
}

function bindAdminRemoteButtons(
  socket,
  {
    btnForceUpdateCheck,
    btnInstallUpdate,
    btnRestartService,
    btnOpenQrBrowserServer,
    btnOpenQrBrowserClient,
    btnToggleQrOverlay,
    btnOpenServerInfoBrowserServer,
    btnOpenServerInfoBrowserClient,
    btnOpenConfigPage,
    btnOpenPreferencesPage,
    btnRotateEntryToken,
    adminActionsDisabledMessage,
  },
) {
  const adminButtons = [
    btnForceUpdateCheck,
    btnInstallUpdate,
    btnRestartService,
    btnOpenQrBrowserServer,
    btnOpenQrBrowserClient,
    btnToggleQrOverlay,
    btnOpenServerInfoBrowserServer,
    btnOpenServerInfoBrowserClient,
    btnOpenConfigPage,
    btnRotateEntryToken,
  ];

  const syncAdminButtonsState = () => {
    const { adminActionsEnabled = true } = getClientSystemConfig();
    for (const button of adminButtons) {
      if (!button) {
        continue;
      }
      button.disabled = !adminActionsEnabled;
      button.setAttribute('aria-disabled', adminActionsEnabled ? 'false' : 'true');
    }

    adminActionsDisabledMessage?.classList.toggle('hidden', adminActionsEnabled);
  };

  btnForceUpdateCheck.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_ADMIN_UPDATE_CHECK));
  btnInstallUpdate.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_ADMIN_UPDATE_INSTALL));
  btnRestartService.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_ADMIN_SERVICE_RESTART));
  btnOpenQrBrowserServer.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_SERVER));
  btnOpenQrBrowserClient.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_ADMIN_OPEN_QR_BROWSER_CLIENT));
  btnToggleQrOverlay.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_ADMIN_TOGGLE_QR_OVERLAY));
  btnOpenServerInfoBrowserServer.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_SERVER));
  btnOpenServerInfoBrowserClient.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_ADMIN_OPEN_SERVER_INFO_BROWSER_CLIENT));
  btnOpenConfigPage.addEventListener('click', () => {
    window.location.href = '/ui/admin/config';
  });
  btnOpenPreferencesPage?.addEventListener('click', () => {
    window.location.href = '/ui/admin/preferences';
  });
  btnRotateEntryToken.addEventListener('click', () => emitWithTimestamp(socket, REMOTE_EVENT_ADMIN_ROTATE_ENTRY_TOKEN));

  syncAdminButtonsState();
  onClientConfigChange(syncAdminButtonsState);
}

export function bindActionButtons(socket, elements) {
  bindBrowserRemoteButtons(socket, elements);
  bindSamsungRemoteButtons(socket, elements);
  bindAdminRemoteButtons(socket, elements);
}
