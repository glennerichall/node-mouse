import {jest} from '@jest/globals';
import {buildDevNative} from '../../scripts/build-dev-native.mjs';

describe('development native build', () => {
  it('builds Linux native components before starting the dev server', () => {
    const run = jest.fn(() => ({status: 0}));

    buildDevNative({platform: 'linux', run, log: jest.fn()});

    expect(run.mock.calls.map(([script]) => script.split('/').at(-1))).toEqual([
      'build-uinput-bridge.sh',
      'build-xwayland-overlay.sh',
    ]);
  });

  it('does not attempt Linux native builds on other platforms', () => {
    const run = jest.fn();

    buildDevNative({platform: 'win32', run, log: jest.fn()});

    expect(run).not.toHaveBeenCalled();
  });

  it('stops startup when a required native build fails', () => {
    const run = jest.fn(() => ({status: 1}));

    expect(() => buildDevNative({platform: 'linux', run, log: jest.fn()}))
      .toThrow("Native development build 'build-uinput-bridge.sh' failed with status 1.");
    expect(run).toHaveBeenCalledTimes(1);
  });
});
