import {EventEmitter} from 'node:events';
import {jest} from '@jest/globals';
import {createApplicationShutdown} from '../../server/application/shutdown.js';
import {ensureApplicationLifecycleState} from '../../server/application/state.js';

describe('application shutdown', () => {
  it('closes the QR overlay without waiting for its pending startup command', async () => {
    const httpServer = new EventEmitter();
    httpServer.close = (callback) => callback();
    const overlayClose = jest.fn();
    const services = {
      getServer: () => ({
        server: httpServer,
        io: {close: (callback) => callback()},
      }),
      getTaskManager: () => ({stop: jest.fn()}),
      getQrOverlay: () => ({close: overlayClose}),
      getSseService: () => ({closeAll: jest.fn()}),
      getDesktopController: () => ({close: jest.fn()}),
      getPersistence: () => ({
        restartLogDao: {createLifecycleEvent: jest.fn()},
        close: jest.fn(),
      }),
    };
    ensureApplicationLifecycleState(services).startupQrOverlayPromise = new Promise(() => {});
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);

    try {
      await createApplicationShutdown(services)('SIGINT');
      expect(overlayClose).toHaveBeenCalledTimes(1);
      expect(exit).toHaveBeenCalledWith(0);
    } finally {
      exit.mockRestore();
    }
  });
});
