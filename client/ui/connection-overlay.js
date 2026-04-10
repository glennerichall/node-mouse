export function bindConnectionOverlay(socket, overlay, i18n) {
  const titleEl = overlay.querySelector('[data-connection-title]');
  const messageEl = overlay.querySelector('[data-connection-message]');

  function setContent(title, message) {
    if (titleEl) {
      titleEl.textContent = title;
    }
    if (messageEl) {
      messageEl.textContent = message;
    }
  }

  function update() {
    const {t} = i18n.getI18n();
    const connected = socket.connected;
    if (!connected) {
      setContent(t('main.connectionUnavailableTitle'), t('main.connectionWaiting'));
    }
    overlay.classList.toggle('hidden', connected);
  }

  function handleConnectError(error) {
    const {t} = i18n.getI18n();
    const isUnauthorized = error?.message === 'unauthorized'
      || error?.data?.code === 'ENTRY_TOKEN_INVALID';

    if (isUnauthorized) {
      setContent(
        t('main.connectionExpiredTitle'),
        t('main.connectionExpiredMessage')
      );
      overlay.classList.remove('hidden');
      return;
    }

    update();
  }

  socket.on('connect', update);
  socket.on('disconnect', update);
  socket.on('reconnect', update);
  socket.on('connect_error', handleConnectError);
  i18n.onChange(() => {
    update();
  });

  update();
}
