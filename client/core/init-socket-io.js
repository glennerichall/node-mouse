import { REMOTE_EVENT_SYSTEM_RELOAD } from '../../utils/shared/remoteCommands.js';

const SYSTEM_RELOAD_GUARD_KEY = 'remote-mouse.system-reload-at';
const SYSTEM_RELOAD_GUARD_MS = 15_000;

export function initSocketIo() {
  const socket = io();
  socket.on(REMOTE_EVENT_SYSTEM_RELOAD, () => {
    const lastReloadAt = Number(window.sessionStorage.getItem(SYSTEM_RELOAD_GUARD_KEY) || 0);
    if (lastReloadAt > 0 && (Date.now() - lastReloadAt) < SYSTEM_RELOAD_GUARD_MS) {
      return;
    }
    window.sessionStorage.setItem(SYSTEM_RELOAD_GUARD_KEY, String(Date.now()));
    window.location.reload();
  });
  return socket;
}
