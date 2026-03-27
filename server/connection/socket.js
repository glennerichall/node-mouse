export function registerSocketHandlers({
                                           io,
                                           actions = [],
                                           notifier,
                                           prepareSocketAuth,
                                           authorizeSocket,
                                       }) {
    if (typeof prepareSocketAuth === 'function') {
        prepareSocketAuth(io);
    }

    io.use(authorizeSocket);

    io.on('connection', (socket) => {
        console.log(`Client connecté: ${socket.id}`);
        notifier.notify({
            level: 'info',
            title: 'Client connecte',
            message: `Client ${socket.id.slice(0, 8)} connecte.`,
        });

        for (const action of actions) {
            if (typeof action === 'function') {
                action(socket);
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
