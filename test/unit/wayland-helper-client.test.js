import {EventEmitter} from 'node:events';
import {jest} from '@jest/globals';

import {createWaylandHelperClient} from '../../server/os/linux/wayland/createWaylandHelperClient.js';

function createChild() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = new EventEmitter();
  child.stdin.writable = true;
  child.stdin.write = jest.fn();
  return child;
}

describe('Wayland helper client', () => {
  it('starts one helper, parses status lines and writes commands', () => {
    const child = createChild();
    const spawn = jest.fn(() => child);
    const onStatus = jest.fn();
    const helper = createWaylandHelperClient({
      helperPath: '/tmp/remote-mouse-wayland-test',
      pathExists: () => true,
      spawn,
      onStatus,
    });

    helper.start();
    helper.start();
    child.stdout.emit('data', Buffer.from('{"type":"status","status":"ready"}\n'));
    helper.send('MOVE 1 2');

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(helper.getStatus()).toEqual({type: 'status', status: 'ready'});
    expect(onStatus).toHaveBeenCalledWith({type: 'status', status: 'ready'});
    expect(child.stdin.write).toHaveBeenCalledWith('MOVE 1 2\n');
  });

  it('does not crash when the helper pipe closes during shutdown', () => {
    const child = createChild();
    const helper = createWaylandHelperClient({
      helperPath: '/tmp/remote-mouse-wayland-test',
      pathExists: () => true,
      spawn: () => child,
    });
    helper.start();

    const error = Object.assign(new Error('write EPIPE'), {code: 'EPIPE'});

    expect(() => {
      helper.stop();
      child.stdin.emit('error', error);
    }).not.toThrow();
  });

  it('reports an actionable error when the helper binary is missing', () => {
    const helper = createWaylandHelperClient({
      helperPath: '/missing/remote-mouse-wayland',
      pathExists: () => false,
    });

    expect(() => helper.start()).toThrow('npm run build:wayland');
  });
});
