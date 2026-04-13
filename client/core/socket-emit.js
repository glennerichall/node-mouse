export function emitWithTimestamp(socket, eventName, payload = {}) {
    socket.emit(eventName, {
        ...payload,
        ts: Date.now(),
    });
}