import {jest} from '@jest/globals';
import {emitWithTimestamp} from '../../client/core/socket-emit.js';

describe('emitWithTimestamp', () => {
  it('delegates to the transport encoder without double-wrapping route requests', () => {
    const transport = {emitWithTimestamp: jest.fn()};

    emitWithTimestamp(transport, 'mouse/move', {dx: 2, dy: 1});

    expect(transport.emitWithTimestamp).toHaveBeenCalledWith('mouse/move', {dx: 2, dy: 1});
    expect(transport.emit).toBeUndefined();
  });
});
