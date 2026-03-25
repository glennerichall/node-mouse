export function registerSocketHandlers(io, {
  mouse,
  keyboard,
  browser,
  preview,
  notifier,
  entryTokenManager,
  getEntryUrl,
}) {
  io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.entryToken;
    if (entryTokenManager.isValid(token)) {
      next();
      return;
    }
    next(new Error('unauthorized'));
  });

  io.on('connection', (socket) => {
    console.log(`Client connecté: ${socket.id}`);
    notifier.notify({
      level: 'info',
      title: 'Client connecte',
      message: `Client ${socket.id.slice(0, 8)} connecte.`,
    });
    const previewSession = preview.startForSocket(socket);

    socket.emit('entry:update', {
      token: entryTokenManager.getCurrentToken(),
      path: entryTokenManager.getEntryPath(),
      url: getEntryUrl(),
    });

    socket.on('mouse:move', (payload = {}) => {
      const dx = Number(payload.dx) || 0;
      const dy = Number(payload.dy) || 0;
      mouse.move(dx, dy);
    });

    socket.on('mouse:click', (payload = {}) => {
      mouse.click(payload.button);
    });

    socket.on('mouse:scroll', (payload = {}) => {
      const dy = Number(payload.dy) || 0;
      mouse.scroll(dy);
    });

    socket.on('keyboard:text', (payload = {}) => {
      keyboard.typeText(payload.text);
    });

    socket.on('keyboard:key', (payload = {}) => {
      keyboard.pressSpecialKey(payload.key, payload.modifiers);
    });

    socket.on('browser:brave', async () => {
      await browser.focusOrLaunchBrave();
    });

    socket.on('disconnect', () => {
      previewSession.stop();
      console.log(`Client déconnecté: ${socket.id}`);
      notifier.notify({
        level: 'info',
        title: 'Client deconnecte',
        message: `Client ${socket.id.slice(0, 8)} deconnecte.`,
      });
    });
  });
}
