import {jest} from '@jest/globals';
import {createMouseMoveDispatcher} from '../../server/services/input/createMouseMoveDispatcher.js';

describe('mouse move dispatcher', () => {
  it('normalizes and coalesces adjusted mouse deltas', async () => {
    let releaseFirst;
    const firstMove = new Promise((resolve) => { releaseFirst = resolve; });
    const mouse = {move: jest.fn().mockReturnValueOnce(firstMove).mockResolvedValue(undefined)};
    const dispatch = createMouseMoveDispatcher(mouse);

    dispatch({dx: '1', dy: 2, adjusted: true});
    dispatch({dx: 3, dy: 4, adjusted: true});
    dispatch({dx: 5, dy: 6, adjusted: true});

    expect(mouse.move).toHaveBeenCalledWith(1, 2, {adjusted: true});
    expect(mouse.move).toHaveBeenCalledTimes(1);

    releaseFirst();
    await firstMove;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mouse.move).toHaveBeenLastCalledWith(8, 10, {adjusted: true});
    expect(mouse.move).toHaveBeenCalledTimes(2);
  });

  it('preserves the legacy marker for unadjusted clients', async () => {
    const mouse = {move: jest.fn().mockResolvedValue(undefined)};
    createMouseMoveDispatcher(mouse)({dx: 2, dy: -1});
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mouse.move).toHaveBeenCalledWith(2, -1, {adjusted: false});
  });
});
