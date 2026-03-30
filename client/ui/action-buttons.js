import { emitWithTimestamp } from '../core/socket-emit.js';

function bindKeyboardRemoteButtons(socket, { keyboardPanel, btnEnter, btnBackspace }) {
  btnEnter.addEventListener('click', () => {
    emitWithTimestamp(socket, 'keyboard:key', { key: 'enter' });
    keyboardPanel.classList.add('hidden');
  });

  btnBackspace.addEventListener('click', () => emitWithTimestamp(socket, 'keyboard:key', { key: 'backspace' }));
}

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
  btnOpenBrave.addEventListener('click', () => emitWithTimestamp(socket, 'browser:brave'));
  btnBrowserBack.addEventListener('click', () =>
    emitWithTimestamp(socket, 'keyboard:key', { key: 'left', modifiers: ['alt'] }),
  );
  btnBrowserForward.addEventListener('click', () =>
    emitWithTimestamp(socket, 'keyboard:key', { key: 'right', modifiers: ['alt'] }),
  );
  btnPrevTab.addEventListener('click', () =>
    emitWithTimestamp(socket, 'keyboard:key', { key: 'tab', modifiers: ['control', 'shift'] }),
  );
  btnNextTab.addEventListener('click', () =>
    emitWithTimestamp(socket, 'keyboard:key', { key: 'tab', modifiers: ['control'] }),
  );
  btnNewTab.addEventListener('click', () =>
    emitWithTimestamp(socket, 'keyboard:key', { key: 't', modifiers: ['control'] }),
  );
  btnCloseTab.addEventListener('click', () =>
    emitWithTimestamp(socket, 'keyboard:key', { key: 'w', modifiers: ['control'] }),
  );
  btnAddressBar.addEventListener('click', () =>
    emitWithTimestamp(socket, 'keyboard:key', { key: 'l', modifiers: ['control'] }),
  );
  btnHardReload.addEventListener('click', () =>
    emitWithTimestamp(socket, 'keyboard:key', { key: 'f5', modifiers: ['control'] }),
  );
  btnFullscreen.addEventListener('click', () => emitWithTimestamp(socket, 'keyboard:key', { key: 'f11' }));
}

function bindSamsungRemoteButtons(
  socket,
  {
    btnSamsungOn,
    btnSamsungOff,
    btnSamsungVolUp,
    btnSamsungVolDown,
    btnSamsungInput,
    btnSamsungEnter,
    btnSamsungPcInput,
  },
) {
  btnSamsungOn.addEventListener('click', () => emitWithTimestamp(socket, 'samsung:on'));
  btnSamsungOff.addEventListener('click', () => emitWithTimestamp(socket, 'samsung:off'));
  btnSamsungVolUp.addEventListener('click', () => emitWithTimestamp(socket, 'samsung:volup'));
  btnSamsungVolDown.addEventListener('click', () => emitWithTimestamp(socket, 'samsung:voldown'));
  btnSamsungInput.addEventListener('click', () => emitWithTimestamp(socket, 'samsung:input'));
  btnSamsungEnter.addEventListener('click', () => emitWithTimestamp(socket, 'samsung:enter'));
  btnSamsungPcInput.addEventListener('click', () => emitWithTimestamp(socket, 'samsung:pc-input'));
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
    btnRotateEntryToken,
  },
) {
  btnForceUpdateCheck.addEventListener('click', () => emitWithTimestamp(socket, 'admin:update-check'));
  btnInstallUpdate.addEventListener('click', () => emitWithTimestamp(socket, 'admin:update-install'));
  btnRestartService.addEventListener('click', () => emitWithTimestamp(socket, 'admin:service-restart'));
  btnOpenQrBrowserServer.addEventListener('click', () => emitWithTimestamp(socket, 'admin:open-qr-browser-server'));
  btnOpenQrBrowserClient.addEventListener('click', () => emitWithTimestamp(socket, 'admin:open-qr-browser-client'));
  btnToggleQrOverlay.addEventListener('click', () => emitWithTimestamp(socket, 'admin:toggle-qr-overlay'));
  btnOpenServerInfoBrowserServer.addEventListener('click', () => emitWithTimestamp(socket, 'admin:open-server-info-browser-server'));
  btnOpenServerInfoBrowserClient.addEventListener('click', () => emitWithTimestamp(socket, 'admin:open-server-info-browser-client'));
  btnRotateEntryToken.addEventListener('click', () => emitWithTimestamp(socket, 'admin:rotate-entry-token'));
}

export function bindActionButtons(socket, elements) {
  bindKeyboardRemoteButtons(socket, elements);
  bindBrowserRemoteButtons(socket, elements);
  bindSamsungRemoteButtons(socket, elements);
  bindAdminRemoteButtons(socket, elements);
}
