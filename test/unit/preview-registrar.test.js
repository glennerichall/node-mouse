import {jest} from '@jest/globals';
import {createPreviewEventRegistrar} from '../../server/remotes/preview/registrar.js';
import {REMOTE_EVENT_PREVIEW_START} from '../../utils/remoteCommands.js';

describe('preview event registrar', () => {
  it('refuses preview start when native capture is unavailable', () => {
    const handlers = new Map();
    const socket = {
      on: jest.fn((event, handler) => handlers.set(event, handler)),
    };
    const preview = {
      isAvailable: jest.fn(() => false),
      startForSocket: jest.fn(),
    };

    createPreviewEventRegistrar({
      preview,
      getConfig: () => ({preview: {enabled: true}}),
    })(socket);
    handlers.get(REMOTE_EVENT_PREVIEW_START)();

    expect(preview.isAvailable).toHaveBeenCalledTimes(1);
    expect(preview.startForSocket).not.toHaveBeenCalled();
  });
});
