import {EventEmitter} from 'node:events';
import {jest} from '@jest/globals';
import {listenForServer} from '../../server/application/listenForServer.js';

describe('listenForServer', () => {
  it('resolves after the server starts listening', async () => {
    const server = new EventEmitter();
    server.listen = jest.fn((_port, _host, callback) => {
      callback();
    });

    await expect(listenForServer(server, {port: 4312, host: '127.0.0.1'})).resolves.toBeUndefined();
    expect(server.listenerCount('error')).toBe(0);
  });

  it('rejects promptly with an actionable message when the port is occupied', async () => {
    const server = new EventEmitter();
    server.listen = jest.fn(() => {
      queueMicrotask(() => {
        const error = new Error('address in use');
        error.code = 'EADDRINUSE';
        server.emit('error', error);
      });
    });

    await expect(listenForServer(server, {port: 4312, host: '127.0.0.1'}))
      .rejects.toMatchObject({
        code: 'EADDRINUSE',
        message: 'Cannot start server: 127.0.0.1:4312 is already in use',
      });
    expect(server.listenerCount('listening')).toBe(0);
  });
});
