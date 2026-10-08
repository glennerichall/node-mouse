export function emitWithTimestamp(socket, eventName, payload = {}, method = 'POST') {
    if (typeof socket.emitWithTimestamp === 'function') {
        if (method === 'POST') socket.emitWithTimestamp(eventName, payload);
        else socket.emitWithTimestamp(eventName, payload, method);
        return;
    }

    socket.emit('route:request', {
        path: eventName,
        method,
        body: {
            ...payload,
            ts: Date.now(),
        },
    });
}
