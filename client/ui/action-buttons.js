import { emitWithTimestamp } from '../core/socket-emit.js';

export function bindActionButtons(
  socket,
  {
    btnEnter,
    btnBackspace,
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
    btnForceUpdateCheck,
    btnInstallUpdate,
    btnRestartService,
    btnOpenQrBrowser,
    btnToggleQrOverlay,
    btnOpenServerInfoBrowser,
    btnRotateEntryToken,
  },
) {
  btnEnter.addEventListener('click', () => emitWithTimestamp(socket, 'keyboard:key', { key: 'enter' }));
  btnBackspace.addEventListener('click', () => emitWithTimestamp(socket, 'keyboard:key', { key: 'backspace' }));
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

  btnForceUpdateCheck.addEventListener('click', () => emitWithTimestamp(socket, 'admin:update-check'));
  btnInstallUpdate.addEventListener('click', () => emitWithTimestamp(socket, 'admin:update-install'));
  btnRestartService.addEventListener('click', () => emitWithTimestamp(socket, 'admin:service-restart'));
  btnOpenQrBrowser.addEventListener('click', () => emitWithTimestamp(socket, 'admin:open-qr-browser'));
  btnToggleQrOverlay.addEventListener('click', () => emitWithTimestamp(socket, 'admin:toggle-qr-overlay'));
  btnOpenServerInfoBrowser.addEventListener('click', () => emitWithTimestamp(socket, 'admin:open-server-info-browser'));
  btnRotateEntryToken.addEventListener('click', () => emitWithTimestamp(socket, 'admin:rotate-entry-token'));
}
