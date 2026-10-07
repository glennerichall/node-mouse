import {jest} from '@jest/globals';
import {logStartupConfig} from '../../server/services/config/logConfig.js';

describe('startup configuration logging', () => {
  it('logs functional and system update settings separately', () => {
    const logger = {info: jest.fn()};

    logStartupConfig(logger, {
      config: {
        input: {},
        preview: {},
        notifications: {},
        samsungTv: {mac: ''},
        updateCheck: {enabled: true, intervalMin: 60},
        qrOverlay: {},
      },
      systemConfig: {
        protocol: 'http',
        port: 3000,
        listenHost: '127.0.0.1',
        publicBaseUrl: '',
        serverHost: '',
        entryPath: {fixed: '', rotateMin: 60},
        session: {},
        adminActionsEnabled: true,
        serviceName: 'remote-mouse.service',
        updateCheck: {
          packageName: '@velor/remote-mouse',
          currentVersion: '6.4.10',
          checkCommand: '',
          installCommand: '',
        },
        graphicalDisplay: {},
        https: {enabled: false},
      },
    });

    expect(logger.info).toHaveBeenCalledWith(
      {enabled: true, intervalMin: 60},
      'config.updateCheck',
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        packageName: '@velor/remote-mouse',
        currentVersion: '6.4.10',
      }),
      'config.systemUpdateCheck',
    );
  });
});
