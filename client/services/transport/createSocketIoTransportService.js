import {initSocketIo} from '../../core/init-socket-io.js';

export function createSocketIoTransportService(services) {
  const {getPubSub} = services;
  let socket = null;

  function ensureSocket() {
    if (!socket) {
      socket = initSocketIo();
      getPubSub().publish('transport.connected-service', {transport: api});
    }

    return socket;
  }

  const api = {
    connect() {
      return ensureSocket();
    },
    getSocket() {
      return ensureSocket();
    },
    emit(eventName, payload) {
      ensureSocket().emit(eventName, payload);
    },
    emitWithTimestamp(eventName, payload = {}) {
      ensureSocket().emit(eventName, {
        ...payload,
        ts: Date.now(),
      });
    },
    on(eventName, handler) {
      ensureSocket().on(eventName, handler);
      return () => {
        ensureSocket().off(eventName, handler);
      };
    },
    once(eventName, handler) {
      ensureSocket().once(eventName, handler);
    },
    off(eventName, handler) {
      ensureSocket().off(eventName, handler);
    },
    get connected() {
      return Boolean(socket?.connected);
    },
  };

  return api;
}
