import {EventEmitter} from 'node:events';
import {jest} from '@jest/globals';

import {createUInputHelperClient} from '../../server/os/linux/wayland/createUInputHelperClient.js';

function createChild() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = new EventEmitter();
  child.stdin.writable = true;
  child.stdin.write = jest.fn();
  return child;
}

describe('uinput helper client', () => {
  it('starts lazily, forwards commands and publishes ready status', () => {
    const child = createChild();
    const spawn = jest.fn(() => child);
    const helper = createUInputHelperClient({helperPath: '/tmp/uinput-helper', spawn, pathExists: () => true});

    helper.start();
    child.stdout.emit('data', Buffer.from('{"type":"status","status":"ready"}\n'));
    helper.send('MOVE 3 -1');

    expect(spawn).toHaveBeenCalledTimes(1);
    expect(helper.getStatus()).toEqual({type: 'status', status: 'ready'});
    expect(child.stdin.write).toHaveBeenCalledWith('MOVE 3 -1\n');
  });

  it('reports a missing helper with an actionable build command', () => {
    const helper = createUInputHelperClient({helperPath: '/missing/uinput-helper', pathExists: () => false});
    expect(() => helper.start()).toThrow('npm run build:uinput');
  });
});
