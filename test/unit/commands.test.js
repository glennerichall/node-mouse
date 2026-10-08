import sinon from 'sinon';
import { samsungRouter } from '../../server/connection/actions/samsung.router.js';
import { browserRouter } from '../../server/connection/actions/browser.router.js';
import {
  REMOTE_EVENT_BROWSER_OPEN,
  REMOTE_EVENT_SAMSUNG_ON,
  REMOTE_EVENT_SAMSUNG_VOL_DOWN,
} from '../../utils/remoteCommands.js';

describe('remote command registrars', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('registers samsung events', async () => {
    const samsung = {
      turnOn: sandbox.stub().resolves(),
      turnOff: sandbox.stub().resolves(),
      volumeUp: sandbox.stub().resolves(),
      volumeDown: sandbox.stub().resolves(),
      switchInput: sandbox.stub().resolves(),
      confirm: sandbox.stub().resolves(),
      switchToPcInput: sandbox.stub().resolves(),
    };

    const request = (path) => samsungRouter({method: 'POST', url: `/${path}`, originalUrl: `/${path}`, socket: {id: 'abcdef123456'}, services: {getRemotes: () => ({samsung})}, body: {}}, {}, () => {});
    await request(REMOTE_EVENT_SAMSUNG_ON);
    await request(REMOTE_EVENT_SAMSUNG_VOL_DOWN);
    await new Promise(resolve => setImmediate(resolve));

    expect(samsungRouter.stack.length).toBeGreaterThanOrEqual(5);
  });

  it('registers browser shortcut handling', async () => {
    const handlers = new Map();
    const browser = {
      focusOrLaunchBrowser: sandbox.stub().resolves(),
    };

    await browserRouter({method: 'POST', url: '/sessions', originalUrl: '/sessions', socket: {id: 'abcdef123456'}, services: {getRemotes: () => ({browser}), getConfig: () => ({})}, body: {browserId: 'firefox'}}, {}, () => {});

    expect(browser.focusOrLaunchBrowser.calledOnceWithExactly('firefox')).toBe(true);
  });
});
