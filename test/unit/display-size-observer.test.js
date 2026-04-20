import {jest} from '@jest/globals';

import {startDisplaySizeObserver} from '../../server/init/observers/startDisplaySizeObserver.js';

describe('display size observer', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('remaps mouse coordinates and refreshes QR overlay when display size changes', () => {
    jest.useFakeTimers();
    const sizes = [{width: 1280, height: 720}];
    const getScreenInfo = jest.fn(async () => sizes[0]);
    const remapToScreenSize = jest.fn();
    const setScreenSizeOverride = jest.fn();
    const update = jest.fn();
    const services = {
      getInputController: () => ({
        mouse: {
          remapToScreenSize,
          setScreenSizeOverride,
        },
      }),
      getQrOverlay: () => ({
        update,
      }),
    };

    const stop = startDisplaySizeObserver(services, {intervalMs: 250, getScreenInfo});
    return Promise.resolve()
      .then(() => {
        expect(setScreenSizeOverride).toHaveBeenCalledWith({width: 1280, height: 720});
        sizes[0] = {width: 1920, height: 1080};
        jest.advanceTimersByTime(250);
        return Promise.resolve();
      })
      .then(() => {
        expect(remapToScreenSize).toHaveBeenCalledWith(
          {width: 1280, height: 720},
          {width: 1920, height: 1080},
        );
        expect(update).toHaveBeenCalledTimes(1);
        stop();
      });
  });

  it('keeps the fresh display size override when dimensions do not change', () => {
    jest.useFakeTimers();
    const getScreenInfo = jest.fn(async () => ({width: 1920, height: 1080}));
    const remapToScreenSize = jest.fn();
    const setScreenSizeOverride = jest.fn();
    const services = {
      getInputController: () => ({
        mouse: {
          remapToScreenSize,
          setScreenSizeOverride,
        },
      }),
      getQrOverlay: () => ({
        update: jest.fn(),
      }),
    };

    const stop = startDisplaySizeObserver(services, {intervalMs: 250, getScreenInfo});
    return Promise.resolve()
      .then(() => {
        jest.advanceTimersByTime(250);
        return Promise.resolve();
      })
      .then(() => {
        expect(setScreenSizeOverride).toHaveBeenCalledWith({width: 1920, height: 1080});
        expect(remapToScreenSize).not.toHaveBeenCalled();
        stop();
      });
  });
});
