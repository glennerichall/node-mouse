import {jest} from '@jest/globals';
import {qrRouter} from '../../server/connection/actions/qr.router.js';
import {
  REMOTE_EVENT_QR_OPEN_BROWSER_CLIENT,
  REMOTE_EVENT_QR_OPEN_BROWSER_SERVER,
  REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN,
  REMOTE_EVENT_QR_TOGGLE_OVERLAY,
} from '../../utils/remoteCommands.js';

describe('QR event registrar', () => {
  it('registers controller QR events outside the admin event namespace', async () => {
    const qrActions = {
      openQrBrowserServer: jest.fn(async () => ({ok: true})),
      openQrBrowserClient: jest.fn(async () => ({ok: true})),
      rotateEntryToken: jest.fn(async () => ({ok: true})),
      toggleQrOverlay: jest.fn(async () => ({ok: true})),
    };

    const response = jest.fn();
    const socket = {id: 'controller-1'};
    const next = jest.fn();
    await qrRouter({method: 'POST', url: `/${REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN}`, originalUrl: `/${REMOTE_EVENT_QR_ROTATE_ENTRY_TOKEN}`, socket, services: {getRemotes: () => ({qrActions})}, body: {}},
      {response},
      next,
    );
    expect(qrActions.rotateEntryToken).toHaveBeenCalledWith({clientId: socket.id});
    expect(response).toHaveBeenCalledWith({ok: true, message: undefined});
  });
});
