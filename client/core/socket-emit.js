export function emitWithTimestamp(socket, eventName, payload = {}) {
    if (typeof socket.emitWithTimestamp === 'function') {
        socket.emitWithTimestamp(eventName, payload);
        return;
    }

    socket.emit('route:request', {
        path: eventName,
        method: 'POST',
        body: {
            ...payload,
            ts: Date.now(),
        },
    });
}
