import {jest} from '@jest/globals';
import {createSocketInputGuard, createSocketOriginGuard} from '../../server/connection/socket/socket-input-guard.middleware.js';
import {REMOTE_EVENT_ADMIN_SERVICE_RESTART, REMOTE_EVENT_MOUSE_MOVE} from '../../utils/remoteCommands.js';

function registerGuard(middleware, context = {}) {
  const socket = {
    id: 'socket-1',
    securityContext: context,
    handshake: {headers: {host: 'remote.test'}},
    use: (handler) => { socket.packetGuard = handler; },
  };
  const next = jest.fn();
  middleware(socket, next);
  expect(next).toHaveBeenCalledWith();
  return socket;
}

describe('Socket.IO input guards', () => {
  it('rejects oversized event packets', () => {
    const socket = registerGuard(createSocketInputGuard({maxPayloadBytes: 32}));
    const next = jest.fn();
    socket.packetGuard([REMOTE_EVENT_MOUSE_MOVE, {text: 'x'.repeat(100)}], next);
    expect(next.mock.calls[0][0].message).toBe('payload_too_large');
  });

  it('rate-limits administrative events per session without throttling controller input events', () => {
    const socket = registerGuard(createSocketInputGuard({adminEventLimit: 1}), {deviceSessionId: 'session-a'});
    const first = jest.fn();
    const second = jest.fn();
    socket.packetGuard([REMOTE_EVENT_ADMIN_SERVICE_RESTART, {}], first);
    socket.packetGuard([REMOTE_EVENT_ADMIN_SERVICE_RESTART, {}], second);
    expect(first).toHaveBeenCalledWith();
    expect(second.mock.calls[0][0].message).toBe('rate_limited');

    const input = jest.fn();
    socket.packetGuard([REMOTE_EVENT_MOUSE_MOVE, {dx: 1, dy: 1}], input);
    expect(input).toHaveBeenCalledWith();
  });

  it('rejects a socket handshake from a foreign Origin', () => {
    const guard = createSocketOriginGuard({protocol: 'https', getAllowedOrigins: () => []});
    const next = jest.fn();
    guard({handshake: {headers: {origin: 'https://evil.test', host: 'remote.test'}}}, next);
    expect(next.mock.calls[0][0].message).toBe('origin_not_allowed');
  });
});
