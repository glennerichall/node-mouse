import {jest} from '@jest/globals';
import {createSocketChannelAdapter} from '../../server/connection/socket/createSocketChannelAdapter.js';

describe('Socket.IO channel adapter', () => {
  it('adapts payload and acknowledgement arguments and chains callbacks', () => {
    const listeners = new Map();
    const socket = {
      id: 'socket-1',
      on: jest.fn((eventName, handler) => listeners.set(eventName, handler)),
      emit: jest.fn(),
    };
    const first = jest.fn((_payload, _response, next) => next());
    const second = jest.fn();
    const channel = createSocketChannelAdapter(socket);

    expect(channel.on('command', first, second)).toBe(channel);
    const response = jest.fn();
    listeners.get('command')({value: 42}, response);

    expect(first).toHaveBeenCalledWith({value: 42}, response, expect.any(Function));
    expect(second).toHaveBeenCalledWith({value: 42}, response, expect.any(Function));
    expect(channel.emit('result', {ok: true})).toBe(channel);
    expect(socket.emit).toHaveBeenCalledWith('result', {ok: true});
  });

  it('stops the callback chain until next is called and reports callback errors', () => {
    const listeners = new Map();
    const socket = {id: 'socket-2', on: (_event, handler) => listeners.set('command', handler), emit: jest.fn()};
    const first = jest.fn();
    const second = jest.fn();
    const channel = createSocketChannelAdapter(socket);
    channel.on('command', first, second);

    listeners.get('command')({});
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();

    first.mockImplementationOnce((_payload, _response, next) => next(new Error('blocked')));
    listeners.get('command')({});
    expect(socket.emit).toHaveBeenCalledWith('error', expect.any(Error));
    expect(second).not.toHaveBeenCalled();
  });

  it('rejects an invalid callback chain', () => {
    const socket = {id: 'socket-3', on: jest.fn(), emit: jest.fn()};
    const channel = createSocketChannelAdapter(socket);
    expect(() => channel.on('command', undefined)).toThrow(TypeError);
  });
});
