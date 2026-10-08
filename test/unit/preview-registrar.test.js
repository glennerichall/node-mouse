import {jest} from '@jest/globals';
import {previewRouter} from '../../server/connection/actions/preview.router.js';
import {REMOTE_EVENT_PREVIEW_START} from '../../utils/remoteCommands.js';

describe('preview event registrar', () => {
  it('refuses preview start when native capture is unavailable', async () => {
    const socket = {id: 'preview-client'};
    const preview = {
      isAvailable: jest.fn(() => false),
      startForSocket: jest.fn(),
    };

    await previewRouter({method: 'POST', url: `/${REMOTE_EVENT_PREVIEW_START}`, originalUrl: `/${REMOTE_EVENT_PREVIEW_START}`, socket, services: {getRemotes: () => ({preview}), getConfig: () => ({preview: {enabled: true}})}, body: {}}, {}, jest.fn());

    expect(preview.isAvailable).toHaveBeenCalledTimes(1);
    expect(preview.startForSocket).not.toHaveBeenCalled();
  });
});
