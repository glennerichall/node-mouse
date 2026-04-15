import { REMOTE_EVENT_SYSTEM_RELOAD } from '../../utils/remoteCommands.js';

const SYSTEM_RELOAD_GUARD_KEY = 'remote-mouse.system-reload-at';
const SYSTEM_RELOAD_GUARD_MS = 15_000;
const WAKE_RECONNECT_IDLE_MS = 5_000;
const WAKE_RECONNECT_DEBOUNCE_MS = 100;

const SOCKET_IO_OPTIONS = {
  reconnection: true,
  reconnectionDelay: 250,
  reconnectionDelayMax: 2_000,
  randomizationFactor: 0.2,
  timeout: 4_000,
};

function getDefaultSetTimeout(windowRef) {
  return typeof windowRef?.setTimeout === 'function'
    ? windowRef.setTimeout.bind(windowRef)
    : setTimeout;
}

function getDefaultClearTimeout(windowRef) {
  return typeof windowRef?.clearTimeout === 'function'
    ? windowRef.clearTimeout.bind(windowRef)
    : clearTimeout;
}

function isPageVisible(documentRef) {
  return !documentRef || documentRef.visibilityState !== 'hidden';
}

export function bindSocketWakeReconnect(socket, {
  windowRef = typeof window !== 'undefined' ? window : undefined,
  documentRef = typeof document !== 'undefined' ? document : undefined,
  now = () => Date.now(),
  setTimeoutFn = getDefaultSetTimeout(windowRef),
  clearTimeoutFn = getDefaultClearTimeout(windowRef),
} = {}) {
  if (!socket || !windowRef?.addEventListener) {
    return () => {};
  }

  let lastInactiveAt = 0;
  let reconnectTimer = null;

  function markInactive() {
    lastInactiveAt = now();
  }

  function scheduleWakeReconnect() {
    if (!isPageVisible(documentRef)) {
      return;
    }

    const inactiveDuration = lastInactiveAt > 0 ? now() - lastInactiveAt : 0;
    if (socket.connected && inactiveDuration < WAKE_RECONNECT_IDLE_MS) {
      return;
    }

    if (reconnectTimer) {
      clearTimeoutFn(reconnectTimer);
    }

    reconnectTimer = setTimeoutFn(() => {
      reconnectTimer = null;
      if (!isPageVisible(documentRef)) {
        return;
      }

      if (socket.connected) {
        socket.disconnect?.();
      }

      socket.connect?.();
    }, WAKE_RECONNECT_DEBOUNCE_MS);
  }

  function handleVisibilityChange() {
    if (isPageVisible(documentRef)) {
      scheduleWakeReconnect();
      return;
    }
    markInactive();
  }

  windowRef.addEventListener('pageshow', scheduleWakeReconnect);
  windowRef.addEventListener('focus', scheduleWakeReconnect);
  windowRef.addEventListener('online', scheduleWakeReconnect);
  windowRef.addEventListener('pagehide', markInactive);
  documentRef?.addEventListener?.('visibilitychange', handleVisibilityChange);

  return () => {
    if (reconnectTimer) {
      clearTimeoutFn(reconnectTimer);
      reconnectTimer = null;
    }
    windowRef.removeEventListener?.('pageshow', scheduleWakeReconnect);
    windowRef.removeEventListener?.('focus', scheduleWakeReconnect);
    windowRef.removeEventListener?.('online', scheduleWakeReconnect);
    windowRef.removeEventListener?.('pagehide', markInactive);
    documentRef?.removeEventListener?.('visibilitychange', handleVisibilityChange);
  };
}

export function initSocketIo() {
  const socket = io(SOCKET_IO_OPTIONS);
  bindSocketWakeReconnect(socket);
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
