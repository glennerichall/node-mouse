import sinon from 'sinon';
import { createSamsungRegistrar } from '../../server/remotes/samsung/registrar.js';
import { createBrowserRegistrar } from '../../server/remotes/browser/registrar.js';

describe('remote command registrars', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('registers samsung events', async () => {
    const handlers = new Map();
    const samsung = {
      turnOn: sandbox.stub().resolves(),
      turnOff: sandbox.stub().resolves(),
      volumeUp: sandbox.stub().resolves(),
      volumeDown: sandbox.stub().resolves(),
      switchInput: sandbox.stub().resolves(),
      confirm: sandbox.stub().resolves(),
      switchToPcInput: sandbox.stub().resolves(),
    };

    const register = createSamsungRegistrar({ samsung });
    register({
      id: 'abcdef123456',
      on(eventName, handler) {
        handlers.set(eventName, handler);
      },
    });

    await handlers.get('samsung:on')();
    await handlers.get('samsung:voldown')();

    expect(samsung.turnOn.calledOnce).toBe(true);
    expect(samsung.volumeDown.calledOnce).toBe(true);
  });

  it('registers browser shortcut handling', async () => {
    const handlers = new Map();
    const browser = {
      focusOrLaunchBrave: sandbox.stub().resolves(),
    };

    const register = createBrowserRegistrar({ browser });

    register({
      id: 'abcdef123456',
      on(eventName, handler) {
        handlers.set(eventName, handler);
      },
    });

    await handlers.get('browser:brave')();

    expect(browser.focusOrLaunchBrave.calledOnce).toBe(true);
  });
});
