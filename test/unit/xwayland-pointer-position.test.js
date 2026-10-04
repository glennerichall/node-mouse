import {jest} from '@jest/globals';

import {
  loadXWaylandPointerPosition,
} from '../../server/os/linux/wayland/loadXWaylandPointerPosition.js';

describe('XWayland pointer position loader', () => {
  function createWorkerHarness() {
    const handlers = new Map();
    const worker = {
      on: jest.fn((event, handler) => handlers.set(event, handler)),
      unref: jest.fn(),
      terminate: jest.fn(),
    };
    return {worker, emit: (event, value) => handlers.get(event)?.(value)};
  }

  it('reads cached root coordinates published outside the main thread', () => {
    const harness = createWorkerHarness();
    const createWorker = jest.fn(() => harness.worker);
    const getPointerPosition = loadXWaylandPointerPosition({
      bridgePath: '/tmp/xwayland-pointer.node',
      createWorker,
    });

    expect(getPointerPosition()).toBeNull();
    harness.emit('message', {x: 1910, y: 70});
    expect(getPointerPosition()).toEqual({x: 1910, y: 70});
    expect(harness.worker.unref).toHaveBeenCalledTimes(1);

    getPointerPosition.close();
    expect(harness.worker.terminate).toHaveBeenCalledTimes(1);
  });

  it('returns no coordinate when the optional XWayland worker is unavailable', () => {
    const getPointerPosition = loadXWaylandPointerPosition({
      bridgePath: '/missing/xwayland-pointer.node',
      createWorker: () => { throw new Error('missing'); },
    });

    expect(getPointerPosition()).toBeNull();
  });
});
