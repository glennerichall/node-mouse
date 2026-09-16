import {jest} from '@jest/globals';
import {createForceUpdateCheckAction} from '../../server/remotes/admin/createForceUpdateCheckAction.js';

describe('force update check action', () => {
  it('forces the update manager check', async () => {
    const check = jest.fn().mockResolvedValue({
      checked: true,
      hasUpdate: true,
    });
    const forceUpdateCheck = createForceUpdateCheckAction({
      getUpdateManager: () => ({check}),
      getEvents: () => ({publishEvent: jest.fn()}),
    });

    await expect(forceUpdateCheck({clientId: 'client-1'})).resolves.toEqual({
      ok: true,
      message: 'Mise a jour detectee.',
    });
    expect(check).toHaveBeenCalledWith({force: true});
  });
});
