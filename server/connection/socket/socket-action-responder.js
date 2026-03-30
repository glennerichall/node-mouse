export function createSocketActionResponder({ socket, eventName = 'admin:result' }) {
  return function respondAction(action, result = {}) {
    socket.emit(eventName, {
      action,
      ok: Boolean(result.ok),
      message: result.message,
      openUrl: result.openUrl,
    });
  };
}
