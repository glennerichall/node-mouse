export function bindConnectionOverlay(services, dom) {
  const socket = services.getTransport();
  const i18n = services.getI18n();
  const overlay = dom.connectionOverlay;

  if (!overlay) {
    return;
  }

  const titleEl = overlay.querySelector('[data-connection-title]');
  const messageEl = overlay.querySelector('[data-connection-message]');
  const detailEl = overlay.querySelector('[data-connection-detail]');

  function transportName() {
    return socket?.io?.engine?.transport?.name || socket?.io?.engine?.transport?.query?.transport || 'unknown';
  }

  function setDetail(value) {
    if (detailEl) detailEl.textContent = value || '';
  }

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
      setDetail(t('main.connectionDiagnostic', {transport: transportName()}));
    } else {
      setDetail(t('main.connectionDiagnostic', {transport: transportName()}));
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
      setDetail(t('main.connectionDiagnosticError', {message: error?.message || 'unauthorized', transport: transportName()}));
      overlay.classList.remove('hidden');
      return;
    }

    update();
    setDetail(t('main.connectionDiagnosticError', {message: error?.message || 'connection failed', transport: transportName()}));
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
