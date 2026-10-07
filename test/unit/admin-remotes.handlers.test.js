import {jest} from '@jest/globals';
import {
  isBrowserEnabled,
  listBrowsers,
  listRemotes,
} from '../../server/connection/api/handlers/admin-remotes.handlers.js';

function response() {
  return {json: jest.fn()};
}

describe('admin remotes handlers', () => {
  it('applies global and per-browser enabled flags', () => {
    expect(isBrowserEnabled({browser: {enabled: true, firefox: false}}, 'firefox')).toBe(false);
    expect(isBrowserEnabled({browser: {enabled: false, firefox: true}}, 'firefox')).toBe(false);
    expect(isBrowserEnabled({browser: {enabled: true, firefox: true}}, 'firefox')).toBe(true);
  });

  it('lists browsers with their effective enabled state', async () => {
    const res = response();
    await listBrowsers({
      services: {
        getConfig: () => ({browser: {enabled: true, firefox: false}}),
        getSystem: () => ({listBrowsers: jest.fn().mockResolvedValue([
          {id: 'firefox', name: 'Firefox'},
        ])}),
      },
    }, res);

    expect(res.json).toHaveBeenCalledWith({
      browsers: [{id: 'firefox', name: 'Firefox', enabled: false}],
    });
  });

  it('adds VLC only when it is available', async () => {
    const res = response();
    await listRemotes({
      services: {
        getConfig: () => ({
          browser: {enabled: true},
          keyboard: {enabled: true},
          preview: {enabled: true},
          samsungTv: {enabled: false},
          vlc: {enabled: true},
        }),
        getSystem: () => ({isVlcAvailable: jest.fn().mockResolvedValue(true)}),
      },
    }, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.remotes.map((remote) => remote.id)).toEqual([
      'browser', 'keyboard', 'vlc', 'system', 'preview', 'samsung',
    ]);
  });
});
