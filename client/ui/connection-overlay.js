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
    const connected = socket.connected;
    if (!connected) {
      setContent('Serveur inaccessible', 'En attente de connexion...');
    }
    overlay.classList.toggle('hidden', connected);
  }

  function handleConnectError(error) {
    const isUnauthorized = error?.message === 'unauthorized'
      || error?.data?.code === 'ENTRY_TOKEN_INVALID';

    if (isUnauthorized) {
      setContent(
        'Connexion expiree',
        'Rescannez le code QR du serveur.'
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

  update();
}
