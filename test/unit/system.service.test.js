import {jest} from '@jest/globals';
import {createSystemService} from '../../server/services/system/createSystemService.js';

describe('system service', () => {
  function createLogger() {
    return {
      debug: jest.fn(),
      trace: jest.fn(),
    };
  }

  it('aggregates browsers, vlc, screen and network information', async () => {
    const service = createSystemService({
      getLogger: () => createLogger(),
      getOs: () => ({
        platform: 'linux',
      }),
      getRemotes: () => ({
        browser: {
          listBrowsers: jest.fn(async () => ([
            {id: 'firefox', name: 'Firefox'},
          ])),
        },
        vlc: {
          isAvailable: jest.fn(async () => true),
        },
      }),
      getConfig: () => ({
        browser: {enabled: true},
        keyboard: {enabled: true},
        vlc: {enabled: false},
        preview: {enabled: true},
        samsungTv: {enabled: false},
      }),
      getRobot: () => ({
        getScreenSize: () => ({
          width: 1920,
          height: 1080,
        }),
      }),
      getSystemConfig: () => ({
        protocol: 'http',
        port: 3000,
        host: '192.168.1.10',
      }),
      getUrls: () => ({
        publicBaseUrl: 'http://192.168.1.10:3000',
        localBaseUrl: 'http://127.0.0.1:3000',
      }),
    });

    const info = await service.getInfo();

    expect(info).toEqual(expect.objectContaining({
      platform: 'linux',
      hostname: expect.any(String),
      browsers: [
        {id: 'firefox', name: 'Firefox'},
      ],
      vlc: {available: true},
      applications: expect.arrayContaining([
        expect.objectContaining({
          id: 'browser:firefox',
          name: 'Firefox',
          kind: 'browser',
          available: true,
          remotes: ['browser'],
        }),
        expect.objectContaining({
          id: 'vlc',
          name: 'VLC media player',
          kind: 'media-player',
          available: true,
          remotes: ['vlc'],
        }),
      ]),
      remotes: expect.arrayContaining([
        expect.objectContaining({
          id: 'browser',
          available: true,
          enabled: true,
        }),
        expect.objectContaining({
          id: 'vlc',
          available: true,
          enabled: false,
          inactiveReasons: ['config-disabled'],
        }),
      ]),
      allRemotes: expect.arrayContaining([
        expect.objectContaining({
          id: 'samsung',
          available: true,
          enabled: false,
          inactiveReasons: ['config-disabled'],
        }),
      ]),
      screen: {width: 1920, height: 1080},
      network: expect.objectContaining({
        hostname: expect.any(String),
        protocol: 'http',
        port: 3000,
        lanIp: '192.168.1.10',
        publicBaseUrl: 'http://192.168.1.10:3000',
        localBaseUrl: 'http://127.0.0.1:3000',
        interfaces: expect.any(Array),
      }),
    }));
  });

  it('returns null screen info when robot is unavailable', async () => {
    const service = createSystemService({
      getLogger: () => createLogger(),
      getOs: () => ({
        platform: 'linux',
      }),
      getRemotes: () => ({
        browser: {
          listBrowsers: jest.fn(async () => []),
        },
        vlc: {
          isAvailable: jest.fn(async () => false),
        },
      }),
      getRobot: () => {
        throw new Error('robot unavailable');
      },
      getSystemConfig: () => ({
        protocol: 'http',
        port: 3000,
        host: '',
      }),
      getUrls: () => ({
        publicBaseUrl: 'http://127.0.0.1:3000',
        localBaseUrl: 'http://127.0.0.1:3000',
      }),
    });

    await expect(service.getScreenInfo()).resolves.toBeNull();
  });
});
