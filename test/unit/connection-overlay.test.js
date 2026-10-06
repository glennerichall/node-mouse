import {jest} from '@jest/globals';
import {bindConnectionOverlay} from '../../client/ui/main/connection-overlay.js';

describe('connection overlay diagnostics', () => {
  it('reports the selected transport and connection errors', () => {
    const title = {textContent: ''};
    const message = {textContent: ''};
    const detail = {textContent: ''};
    const overlay = {
      classList: {toggle: jest.fn(), remove: jest.fn()},
      querySelector: jest.fn((selector) => ({
        '[data-connection-title]': title,
        '[data-connection-message]': message,
        '[data-connection-detail]': detail,
      }[selector])),
    };
    const handlers = {};
    const socket = {
      connected: false,
      io: {engine: {transport: {name: 'websocket'}}},
      on: jest.fn((event, handler) => { handlers[event] = handler; }),
    };
    const i18n = {
      getI18n: () => ({t: (key, params = {}) => `${key}:${params.transport || ''}:${params.message || ''}`}),
      onChange: jest.fn(),
    };

    bindConnectionOverlay({getTransport: () => socket, getI18n: () => i18n}, {connectionOverlay: overlay});
    expect(detail.textContent).toContain('websocket');
    handlers.connect_error({message: 'timeout'});
    expect(detail.textContent).toContain('timeout');
    expect(detail.textContent).toContain('websocket');
  });
});
