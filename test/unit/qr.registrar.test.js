import {jest} from '@jest/globals';
import {createQrEventSubscriber} from '../../server/connection/subscribers/qr.subscriber.js';
import {
  REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT,
  REMOTE_EVENT_QR_OPEN_BROWSER_SERVER,
  REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN,
  REMOTE_EVENT_QR_TOGGLE_OVERLAY,
} from '../../utils/remoteCommands.js';

describe('QR event registrar', () => {
  it('registers controller QR events outside the admin event namespace', async () => {
    const handlers = new Map();
    const socket = {
      id: 'controller-1',
      on: jest.fn((eventName, handler) => handlers.set(eventName, handler)),
      emit: jest.fn(),
    };
    const qrActions = {
      openQrBrowserServer: jest.fn(async () => ({ok: true})),
      openQrBrowserClient: jest.fn(async () => ({ok: true})),
      rotateEntryToken: jest.fn(async () => ({ok: true})),
      toggleQrOverlay: jest.fn(async () => ({ok: true})),
    };

    createQrEventSubscriber({qrActions})(socket);

    expect([...handlers.keys()]).toEqual([
      REMOTE_EVENT_QR_OPEN_BROWSER_SERVER,
      REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT,
      REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN,
      REMOTE_EVENT_QR_TOGGLE_OVERLAY,
    ]);
    await handlers.get(REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN)();
    expect(qrActions.rotateEntryToken).toHaveBeenCalledWith({clientId: socket.id});
  });
});
