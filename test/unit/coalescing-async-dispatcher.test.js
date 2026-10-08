import {jest} from '@jest/globals';
import {createCoalescingAsyncDispatcher} from '../../utils/createCoalescingAsyncDispatcher.js';

describe('coalescing async dispatcher', () => {
  it('merges pending contributions while one asynchronous consumption is running', async () => {
    let releaseFirst;
    const firstConsumption = new Promise((resolve) => { releaseFirst = resolve; });
    const consume = jest.fn().mockReturnValueOnce(firstConsumption).mockResolvedValue(undefined);
    const dispatch = createCoalescingAsyncDispatcher({
      normalize: (value) => value,
      canMerge: () => true,
      merge: (pending, contribution) => pending + contribution,
      consume,
    });

    dispatch(1);
    dispatch(3);
    dispatch(5);
    expect(consume).toHaveBeenCalledTimes(1);

    releaseFirst();
    await firstConsumption;
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(consume).toHaveBeenCalledTimes(2);
    expect(consume).toHaveBeenLastCalledWith(8);
  });

  it('reports consumption failures and continues draining pending work', async () => {
    const onError = jest.fn();
    const consume = jest.fn()
      .mockRejectedValueOnce(new Error('input_unavailable'))
      .mockResolvedValue(undefined);
    const dispatch = createCoalescingAsyncDispatcher({
      normalize: (value) => value,
      canMerge: () => true,
      merge: (pending, contribution) => pending + contribution,
      consume,
      onError,
    });

    dispatch(1);
    dispatch(2);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onError).toHaveBeenCalledWith(expect.any(Error), 1);
    expect(consume).toHaveBeenCalledTimes(2);
    expect(consume).toHaveBeenLastCalledWith(2);
  });
});
