import {initSocketIo} from '../../core/init-socket-io.js';

const CONNECTION_STATE = Object.freeze({
  idle: 'idle',
  connecting: 'connecting',
  connected: 'connected',
  reconnecting: 'reconnecting',
  unavailable: 'unavailable',
});

export function createSocketIoTransportService(services, {
  socketFactory = initSocketIo,
} = {}) {
  const {getPubSub} = services;
  let socket = null;
  let connectionState = CONNECTION_STATE.idle;

  function publishConnectionState(nextState, details = {}) {
    connectionState = nextState;
    getPubSub().publish('transport.connection-state', {
      state: nextState,
      ...details,
    });
  }

  function bindSocketLifecycle(nextSocket) {
    nextSocket.on('connect', () => {
      publishConnectionState(CONNECTION_STATE.connected);
    });
    nextSocket.on('disconnect', reason => {
      publishConnectionState(CONNECTION_STATE.reconnecting, {reason});
    });
    nextSocket.on('connect_error', error => {
      publishConnectionState(CONNECTION_STATE.reconnecting, {
        error: error?.message || 'connection failed',
      });
    });
    nextSocket.on('reconnect_failed', () => {
      publishConnectionState(CONNECTION_STATE.unavailable);
    });
  }

  function dropDisconnectedCommand(eventName) {
    getPubSub().publish('transport.command-dropped', {
      eventName,
      reason: 'disconnected',
    });
    return false;
  }

  function ensureSocket() {
    if (!socket) {
      publishConnectionState(CONNECTION_STATE.connecting);
      socket = socketFactory();
      bindSocketLifecycle(socket);
      getPubSub().publish('transport.connected-service', {transport: api});
    }

    return socket;
  }

  const api = {
    connect() {
      return ensureSocket();
    },
    getSocket() {
      return this.connect();
    },
    emit(eventName, payload) {
      const nextSocket = this.getSocket();
      if (!nextSocket.connected) {
        return dropDisconnectedCommand(eventName);
      }
      nextSocket.emit('route:request', {path: eventName, method: 'POST', body: payload ?? {}});
      return true;
    },
    emitWithTimestamp(eventName, payload = {}, method = 'POST') {
      const nextSocket =  this.getSocket();
      if (!nextSocket.connected) {
        return dropDisconnectedCommand(eventName);
      }
      nextSocket.emit('route:request', {
        path: eventName,
        method,
        body: {...payload, ts: Date.now()},
      });
      return true;
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
    getConnectionState() {
      return connectionState;
    },
  };

  return api;
}
