import {jest} from '@jest/globals';

import {createSocketIoTransportService} from '../../client/services/transport/createSocketIoTransportService.js';

function createSocket() {
  const handlers = new Map();
  return {
    connected: false,
    emit: jest.fn(),
    on: jest.fn((eventName, handler) => {
      handlers.set(eventName, handler);
    }),
    trigger(eventName, ...args) {
      if (eventName === 'connect') this.connected = true;
      if (eventName === 'disconnect') this.connected = false;
      handlers.get(eventName)?.(...args);
    },
  };
}

describe('Socket.IO transport lifecycle', () => {
  it('restores connected state and emits only after the socket reconnects', () => {
    const socket = createSocket();
    const publish = jest.fn();
    const transport = createSocketIoTransportService({
      getPubSub: () => ({publish}),
    }, {
      socketFactory: () => socket,
    });

    expect(transport.getConnectionState()).toBe('idle');
    transport.connect();
    expect(transport.getConnectionState()).toBe('connecting');

    socket.trigger('connect');
    expect(transport.connected).toBe(true);
    expect(transport.getConnectionState()).toBe('connected');

    socket.trigger('disconnect', 'service restart');
    expect(transport.connected).toBe(false);
    expect(transport.getConnectionState()).toBe('reconnecting');
    expect(transport.emitWithTimestamp('mouse/move', {dx: 1})).toBe(false);
    expect(socket.emit).not.toHaveBeenCalled();
    expect(publish).toHaveBeenCalledWith('transport.command-dropped', {
      eventName: 'mouse/move',
      reason: 'disconnected',
    });

    socket.connected = true;
    socket.trigger('connect');
    expect(transport.getConnectionState()).toBe('connected');
    expect(transport.emitWithTimestamp('mouse/move', {dx: 2})).toBe(true);
    expect(socket.emit).toHaveBeenCalledTimes(1);
    expect(socket.emit.mock.calls[0][1]).toEqual(expect.objectContaining({
      path: 'mouse/move',
      method: 'POST',
      body: expect.objectContaining({dx: 2, ts: expect.any(Number)}),
    }));
  });

  it('marks the transport unavailable after bounded reconnection attempts', () => {
    const socket = createSocket();
    const publish = jest.fn();
    const transport = createSocketIoTransportService({
      getPubSub: () => ({publish}),
    }, {
      socketFactory: () => socket,
    });

    transport.connect();
    socket.trigger('reconnect_failed');

    expect(transport.getConnectionState()).toBe('unavailable');
    expect(publish).toHaveBeenCalledWith('transport.connection-state', {
      state: 'unavailable',
    });
  });
});
