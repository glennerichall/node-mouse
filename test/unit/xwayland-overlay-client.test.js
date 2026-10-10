import {EventEmitter} from 'node:events';
import {jest} from '@jest/globals';
import {
  buildXWaylandOverlayArgs,
  createXWaylandOverlayClient,
} from '../../server/os/linux/overlay/createXWaylandOverlayClient.js';

function createChild() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stdout.setEncoding = jest.fn();
  child.stderr = new EventEmitter();
  child.stdin = new EventEmitter();
  child.stdin.writable = true;
  child.stdin.write = jest.fn((line) => {
    const [requestId, command] = line.trim().split(' ', 2);
    const response = {
      SHOW: 'visible', HIDE: 'hidden', UPDATE: 'updated', CLOSE: 'closed',
    }[command.split(' ')[0]];
    child.stdout.emit('data', `ACK ${requestId} ${response}\n`);
  });
  child.kill = jest.fn();
  child.killed = false;
  return child;
}

describe('X11/XWayland QR overlay helper client', () => {
  it('builds the stable startup protocol', () => {
    expect(buildXWaylandOverlayArgs({
      qrPath: '/tmp/qr.png', x: 100, y: 20, size: 175, showDelayMs: 1200, autoHide: true,
    })).toEqual(['/tmp/qr.png', '100', '20', '175', '1200', '1']);
  });

  it('sends acknowledged lifecycle commands and tracks helper hover state', async () => {
    const child = createChild();
    const spawnProcess = jest.fn(() => child);
    const client = createXWaylandOverlayClient({
      qrPath: '/tmp/qr.png', x: 100, y: 20, size: 175, showDelayMs: 1200, autoHide: true,
    }, {spawnProcess, helperPath: '/app/overlay'});

    child.stdout.emit('data', 'STATE rea');
    child.stdout.emit('data', 'dy\nSTATE hover-hidden\n');
    expect(client.getState()).toBe('hover-hidden');

    await expect(client.hide()).resolves.toBe(true);
    await expect(client.show()).resolves.toBe(true);
    await expect(client.update({
      qrPath: '/tmp/qr.png', x: 10, y: 15, size: 200, showDelayMs: 800, autoHide: false,
    })).resolves.toBe(true);
    client.close();

    expect(child.stdin.write.mock.calls.map(([value]) => value)).toEqual([
      '1 HIDE\n',
      '2 SHOW\n',
      '3 UPDATE /tmp/qr.png 10 15 200 800 0\n',
    ]);
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('does not crash when the helper pipe emits EPIPE during shutdown', async () => {
    const child = createChild();
    child.stdin.write.mockImplementation(() => {
      child.stdin.emit('error', Object.assign(new Error('write EPIPE'), {code: 'EPIPE'}));
    });
    const client = createXWaylandOverlayClient({
      qrPath: '/tmp/qr.png', x: 100, y: 20, size: 175, showDelayMs: 1200, autoHide: true,
    }, {spawnProcess: () => child, helperPath: '/app/overlay'});

    expect(() => client.close()).not.toThrow();
    await Promise.resolve();
    expect(client.getState()).toBe('closed');
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
  });

  it('marks the client closed when commands can no longer be written', async () => {
    const child = createChild();
    const client = createXWaylandOverlayClient({
      qrPath: '/tmp/qr.png', x: 100, y: 20, size: 175, showDelayMs: 1200, autoHide: true,
    }, {spawnProcess: () => child, helperPath: '/app/overlay'});
    child.stdin.writable = false;

    await expect(client.show()).resolves.toBe(false);
    expect(client.getState()).toBe('closed');
  });

  it('waits for the matching helper acknowledgment before confirming SHOW', async () => {
    const child = createChild();
    child.stdin.write.mockImplementation(jest.fn());
    const client = createXWaylandOverlayClient({
      qrPath: '/tmp/qr.png', x: 100, y: 20, size: 175, showDelayMs: 1200, autoHide: true,
    }, {spawnProcess: () => child, helperPath: '/app/overlay'});
    let completed = false;
    const showing = client.show().then((result) => {
      completed = true;
      return result;
    });

    await Promise.resolve();
    expect(completed).toBe(false);
    child.stdout.emit('data', 'ACK 1 visible\n');
    await expect(showing).resolves.toBe(true);
  });

  it('kills the helper immediately on close and settles commands awaiting an ACK', async () => {
    const child = createChild();
    child.stdin.write.mockImplementation(jest.fn());
    const client = createXWaylandOverlayClient({
      qrPath: '/tmp/qr.png', x: 100, y: 20, size: 175, showDelayMs: 1200, autoHide: true,
    }, {spawnProcess: () => child, helperPath: '/app/overlay', commandTimeoutMs: 10_000});
    const showing = client.show();

    client.close();

    await expect(showing).resolves.toBe(false);
    expect(client.getState()).toBe('closed');
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
    expect(child.stdin.write).toHaveBeenCalledTimes(1);
  });

  it('fails and closes the client when a helper acknowledgment is lost', async () => {
    const child = createChild();
    child.stdin.write.mockImplementation(jest.fn());
    const client = createXWaylandOverlayClient({
      qrPath: '/tmp/qr.png', x: 100, y: 20, size: 175, showDelayMs: 1200, autoHide: true,
    }, {spawnProcess: () => child, helperPath: '/app/overlay', commandTimeoutMs: 20});

    await expect(client.show()).resolves.toBe(false);
    expect(client.getState()).toBe('closed');
    expect(child.kill).toHaveBeenCalledWith('SIGTERM');
  });
});
