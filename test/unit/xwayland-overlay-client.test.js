import {EventEmitter} from 'node:events';
import {jest} from '@jest/globals';
import {
  buildXWaylandOverlayArgs,
  createXWaylandOverlayClient,
} from '../../server/os/linux/wayland/createXWaylandOverlayClient.js';

function createChild() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stdout.setEncoding = jest.fn();
  child.stderr = new EventEmitter();
  child.stdin = {writable: true, write: jest.fn()};
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

  it('sends lifecycle commands and tracks helper hover state', () => {
    const child = createChild();
    const spawnProcess = jest.fn(() => child);
    const client = createXWaylandOverlayClient({
      qrPath: '/tmp/qr.png', x: 100, y: 20, size: 175, showDelayMs: 1200, autoHide: true,
    }, {spawnProcess, helperPath: '/app/overlay'});

    child.stdout.emit('data', 'STATE rea');
    child.stdout.emit('data', 'dy\nSTATE hover-hidden\n');
    expect(client.getState()).toBe('hover-hidden');

    expect(client.hide()).toBe(true);
    expect(client.show()).toBe(true);
    expect(client.update({
      qrPath: '/tmp/qr.png', x: 10, y: 15, size: 200, showDelayMs: 800, autoHide: false,
    })).toBe(true);
    client.close();

    expect(child.stdin.write.mock.calls.map(([value]) => value)).toEqual([
      'HIDE\n',
      'SHOW\n',
      'UPDATE /tmp/qr.png 10 15 200 800 0\n',
      'CLOSE\n',
    ]);
  });
});
