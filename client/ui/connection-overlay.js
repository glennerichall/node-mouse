import {getClientI18n, onClientI18nChange} from '../i18n/index.js';

export function bindConnectionOverlay(socket, overlay) {
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
    const {t} = getClientI18n();
    const connected = socket.connected;
    if (!connected) {
      setContent(t('main.connectionUnavailableTitle'), t('main.connectionWaiting'));
    }
    overlay.classList.toggle('hidden', connected);
  }

  function handleConnectError(error) {
    const {t} = getClientI18n();
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
  onClientI18nChange(() => {
    update();
  });

  update();
}
