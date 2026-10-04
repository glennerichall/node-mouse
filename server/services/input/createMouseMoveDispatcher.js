import {createCoalescingAsyncDispatcher} from '../../../utils/createCoalescingAsyncDispatcher.js';

export function createMouseMoveDispatcher(mouse) {
  return createCoalescingAsyncDispatcher({
    normalize: (payload = {}) => ({
      dx: Number(payload.dx) || 0,
      dy: Number(payload.dy) || 0,
      adjusted: payload.adjusted === true,
    }),
    canMerge: (pending, contribution) => pending.adjusted === contribution.adjusted,
    merge: (pending, contribution) => ({
      dx: pending.dx + contribution.dx,
      dy: pending.dy + contribution.dy,
      adjusted: pending.adjusted,
    }),
    consume: (movement) => mouse.move(
      movement.dx,
      movement.dy,
      {adjusted: movement.adjusted},
    ),
  });
}
