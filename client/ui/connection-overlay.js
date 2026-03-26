export function bindConnectionOverlay(socket, overlay) {
  function update() {
    const connected = socket.connected;
    overlay.classList.toggle('hidden', connected);
  }

  socket.on('connect', update);
  socket.on('disconnect', update);
  socket.on('reconnect', update);
  socket.on('connect_error', update);

  update();
}

