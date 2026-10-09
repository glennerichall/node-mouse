import {jest} from '@jest/globals';
import {createDeviceSessionsPanel} from '../../client/ui/config/device-sessions-panel.js';

class FakeElement extends EventTarget {
  children = [];
  textContent = '';
  className = '';
  disabled = false;

  append(...nodes) {
    this.children.push(...nodes);
  }

  replaceChildren(...nodes) {
    this.children = nodes;
  }
}

function createFixture({fetchImpl, confirm = jest.fn(() => true)} = {}) {
  const listNode = new FakeElement();
  const statusNode = new FakeElement();
  const reloadButton = new FakeElement();
  const documentRef = {createElement: () => new FakeElement()};
  const panel = createDeviceSessionsPanel({
    listNode,
    statusNode,
    reloadButton,
    documentRef,
    fetchImpl,
    confirm,
    t: (key, params = {}) => Object.entries(params).reduce(
      (message, [name, value]) => message.replace(`{${name}}`, value),
      key === 'adminConfig.devices.confirmRevoke' ? 'Revoke {name}?' : key,
    ),
  });
  return {panel, listNode, statusNode, reloadButton, confirm};
}

describe('device sessions admin panel', () => {
  it('renders role and activity while protecting the current session from revocation', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        sessions: [
          {
            id: 'current',
            deviceName: 'This phone',
            role: 'controller',
            state: 'active',
            lastActivityAt: 1_760_000_000_000,
            isCurrent: true,
          },
          {
            id: 'other',
            deviceName: 'Tablet',
            role: 'controller',
            state: 'active',
            lastActivityAt: 1_760_000_000_000,
            isCurrent: false,
          },
          {id: 'old', role: 'controller', state: 'revoked', isCurrent: false},
        ],
      }),
    }));
    const {panel, listNode, statusNode} = createFixture({fetchImpl});

    await panel.load();

    const rows = listNode.children;
    expect(rows).toHaveLength(3);
    expect(rows[0].children.some((child) => child.className === 'device-session-current')).toBe(true);
    expect(rows[0].children.some((child) => child.className === 'device-session-revoke')).toBe(false);
    expect(rows[1].children.some((child) => child.className === 'device-session-revoke')).toBe(true);
    expect(rows[2].children.some((child) => child.className === 'device-session-revoke')).toBe(false);
    expect(statusNode.textContent).toBe('adminConfig.devices.loaded');
  });

  it('revokes one association and refreshes the device list', async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ok: true, sessions: [
          {id: 'tablet-id', deviceName: 'Tablet', role: 'controller', state: 'active'},
        ]}),
      })
      .mockResolvedValueOnce({ok: true, status: 204})
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ok: true, sessions: [
          {id: 'tablet-id', deviceName: 'Tablet', role: 'controller', state: 'revoked'},
        ]}),
      });
    const {panel, listNode, statusNode, confirm} = createFixture({fetchImpl});

    await panel.load();
    const revokeButton = listNode.children[0].children.find(
      (child) => child.className === 'device-session-revoke',
    );
    revokeButton.dispatchEvent(new Event('click'));
    await new Promise((resolve) => setImmediate(resolve));

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Tablet'));
    expect(fetchImpl).toHaveBeenNthCalledWith(2, '/api/admin/sessions/tablet-id', {method: 'DELETE'});
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(listNode.children[0].className).toBe('device-session device-session-revoked');
    expect(statusNode.textContent).toContain('revoked');
  });
});
