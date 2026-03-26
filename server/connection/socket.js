export function registerSocketHandlers(io, {
  eventRegistrars = [],
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

    socket.emit('entry:update', {
      token: entryTokenManager.getCurrentToken(),
      path: entryTokenManager.getEntryPath(),
      url: getEntryUrl(),
    });

    for (const registerEvents of eventRegistrars) {
      if (typeof registerEvents === 'function') {
        registerEvents(socket);
      }
    }

    socket.on('disconnect', () => {
      console.log(`Client déconnecté: ${socket.id}`);
      notifier.notify({
        level: 'info',
        title: 'Client deconnecte',
        message: `Client ${socket.id.slice(0, 8)} deconnecte.`,
      });
    });
  });
}
