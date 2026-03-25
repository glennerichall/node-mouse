export function bindActionButtons(
  socket,
  {
    btnEnter,
    btnBackspace,
    btnOpenBrave,
    btnPrevTab,
    btnNextTab,
    btnNewTab,
    btnCloseTab,
    btnAddressBar,
    btnHardReload,
    btnFullscreen,
  },
) {
  btnEnter.addEventListener('click', () => socket.emit('keyboard:key', { key: 'enter' }));
  btnBackspace.addEventListener('click', () => socket.emit('keyboard:key', { key: 'backspace' }));
  btnOpenBrave.addEventListener('click', () => socket.emit('browser:brave'));
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
}
