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
  },
) {
  btnEnter.addEventListener('click', () => socket.emit('keyboard:key', { key: 'enter' }));
  btnBackspace.addEventListener('click', () => socket.emit('keyboard:key', { key: 'backspace' }));
  btnOpenBrave.addEventListener('click', () => socket.emit('browser:brave'));
  btnBrowserBack.addEventListener('click', () =>
    socket.emit('keyboard:key', { key: 'left', modifiers: ['alt'] }),
  );
  btnBrowserForward.addEventListener('click', () =>
    socket.emit('keyboard:key', { key: 'right', modifiers: ['alt'] }),
  );
  btnPrevTab.addEventListener('click', () =>
    socket.emit('keyboard:key', { key: 'tab', modifiers: ['control', 'shift'] }),
  );
  btnNextTab.addEventListener('click', () =>
    socket.emit('keyboard:key', { key: 'tab', modifiers: ['control'] }),
  );
  btnNewTab.addEventListener('click', () =>
    socket.emit('keyboard:key', { key: 't', modifiers: ['control'] }),
  );
  btnCloseTab.addEventListener('click', () =>
    socket.emit('keyboard:key', { key: 'w', modifiers: ['control'] }),
  );
  btnAddressBar.addEventListener('click', () =>
    socket.emit('keyboard:key', { key: 'l', modifiers: ['control'] }),
  );
  btnHardReload.addEventListener('click', () =>
    socket.emit('keyboard:key', { key: 'f5', modifiers: ['control'] }),
  );
  btnFullscreen.addEventListener('click', () => socket.emit('keyboard:key', { key: 'f11' }));

  btnForceUpdateCheck.addEventListener('click', () => socket.emit('admin:update-check'));
  btnInstallUpdate.addEventListener('click', () => socket.emit('admin:update-install'));
  btnRestartService.addEventListener('click', () => socket.emit('admin:service-restart'));
}
