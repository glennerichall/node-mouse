export function registerSocketHandlers({
                                           io,
                                           actions = [],
                                           notifier,
                                           maxEventAgeMs = 1200,
                                           prepareSocketAuth,
                                           authorizeSocket,
                                       }) {
    if (typeof prepareSocketAuth === 'function') {
        prepareSocketAuth(io);
    }

    io.use(authorizeSocket);

    io.on('connection', (socket) => {
        socket.use((packet, next) => {
            const [, payload] = packet;
            const ts = payload && typeof payload === 'object'
                ? Number(payload.ts)
                : NaN;

            if (!Number.isFinite(ts)) {
                next(new Error('missing_timestamp'));
                return;
            }

            const ageMs = Date.now() - ts;
            if (ageMs > maxEventAgeMs) {
                next(new Error('stale_event'));
                return;
            }

            next();
        });

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
