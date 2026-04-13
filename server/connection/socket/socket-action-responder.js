import { REMOTE_EVENT_ADMIN_RESULT } from '../../../utils/remoteCommands.js';

export function createSocketActionResponder({ socket, eventName = REMOTE_EVENT_ADMIN_RESULT }) {
  return function respondAction(action, result = {}) {
    socket.emit(eventName, {
      action,
      ok: Boolean(result.ok),
      message: result.message,
      openUrl: result.openUrl,
    });
  };
}
