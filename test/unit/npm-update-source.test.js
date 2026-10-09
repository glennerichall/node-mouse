import {jest} from '@jest/globals';

const fetchJson = jest.fn();

jest.unstable_mockModule('../../server/utils/http.js', () => ({
  fetchJson,
}));

const {NpmUpdateSource} = await import('../../server/services/update-manager/NpmUpdateSource.js');

describe('NpmUpdateSource', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns installed and latest versions when an update is available', async () => {
    fetchJson.mockResolvedValue({version: '6.19.65'});
    const source = new NpmUpdateSource({
      packageName: '@velor/remote-mouse',
      currentVersion: '6.19.15',
    });

    await expect(source.check()).resolves.toEqual(expect.objectContaining({
      hasUpdate: true,
      currentVersion: '6.19.15',
      latestVersion: '6.19.65',
      key: 'npm:6.19.65',
    }));
    expect(fetchJson).toHaveBeenCalledWith(
      'https://registry.npmjs.org/%40velor%2Fremote-mouse/latest',
    );
  });

  it('returns both versions when no update is available', async () => {
    fetchJson.mockResolvedValue({version: '6.19.15'});
    const source = new NpmUpdateSource({
      packageName: '@velor/remote-mouse',
      currentVersion: '6.19.15',
    });

    await expect(source.check()).resolves.toEqual({
      hasUpdate: false,
      currentVersion: '6.19.15',
      latestVersion: '6.19.15',
    });
  });
});
