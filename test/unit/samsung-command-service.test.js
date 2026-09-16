import {jest} from '@jest/globals';
import {createSamsungCommandService} from '../../server/remotes/samsung/createSamsungCommandService.js';

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return {promise, resolve};
}

describe('Samsung command service', () => {
  it('does not reuse an obsolete power check after a wake command', async () => {
    const staleCheck = deferred();
    const freshCheck = deferred();
    const getPowerState = jest.fn()
      .mockReturnValueOnce(staleCheck.promise)
      .mockReturnValueOnce(freshCheck.promise);
    const samsungTv = {
      getPowerState,
      wakeTV: jest.fn().mockResolvedValue(),
    };
    const service = createSamsungCommandService({
      getConfig: () => ({enabled: true}),
      discoverDevices: jest.fn(),
      getSamsungTv: async () => samsungTv,
      getLogger: () => ({info: jest.fn(), warn: jest.fn()}),
      createDisabledRemote: jest.fn(),
    });

    const staleResult = service.getPowerState({maxAgeMs: 0});
    await service.turnOn();
    const freshResult = service.getPowerState({maxAgeMs: 0});
    staleCheck.resolve('off');
    freshCheck.resolve('on');

    await expect(staleResult).resolves.toBe('off');
    await expect(freshResult).resolves.toBe('on');
    expect(getPowerState).toHaveBeenCalledTimes(2);
    await expect(service.getPowerState({maxAgeMs: 2500})).resolves.toBe('on');
  });
});
