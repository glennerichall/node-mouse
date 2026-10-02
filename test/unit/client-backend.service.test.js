import {jest} from '@jest/globals';
import {createBackendService} from '../../client/services/backend/createBackendService.js';

describe('client backend service', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({}),
    }));
    global.fetch = fetchMock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete global.fetch;
  });

  it('uses controller-readable resources instead of the admin namespace', async () => {
    const backend = createBackendService({});

    await backend.getClientConfig();
    await backend.createConfigSubscription();
    await backend.deleteSubscription('sub-1');
    await backend.getAvailableRemotes();
    await backend.getAvailableBrowsers();

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/client/config',
      '/api/client/subs/configs',
      '/api/client/subs/sub-1',
      '/api/client/remotes',
      '/api/client/remotes/browsers',
    ]);
  });
});
