import sinon from 'sinon';
import { createCommandEventRegistrar } from '../../server/connection/events/commands.js';

describe('createCommandEventRegistrar', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('registers samsung events without emitting client notifications', async () => {
    const handlers = new Map();
    const emit = sandbox.stub();
    const browser = {
      focusOrLaunchBrave: sandbox.stub().resolves(),
    };
    const samsung = {
      turnOn: sandbox.stub().resolves({ ok: true, message: 'on' }),
      turnOff: sandbox.stub().resolves({ ok: true, message: 'off' }),
      volumeUp: sandbox.stub().resolves({ ok: true, message: 'up' }),
      volumeDown: sandbox.stub().resolves({ ok: false, message: 'down failed' }),
      switchInput: sandbox.stub().resolves({ ok: true, message: 'input' }),
      confirm: sandbox.stub().resolves({ ok: true, message: 'enter' }),
      switchToPcInput: sandbox.stub().resolves({ ok: true, message: 'pc' }),
    };

    const register = createCommandEventRegistrar({ browser, samsung });
    register({
      id: 'abcdef123456',
      emit,
      on(eventName, handler) {
        handlers.set(eventName, handler);
      },
    });

    await handlers.get('samsung:on')();
    await handlers.get('samsung:voldown')();

    expect(samsung.turnOn.calledOnce).toBe(true);
    expect(samsung.volumeDown.calledOnce).toBe(true);
    expect(emit.called).toBe(false);
  });

  it('keeps browser shortcut handling intact', async () => {
    const handlers = new Map();
    const browser = {
      focusOrLaunchBrave: sandbox.stub().resolves(),
    };

    const register = createCommandEventRegistrar({
      browser,
      samsung: {
        turnOn: sandbox.stub(),
        turnOff: sandbox.stub(),
        volumeUp: sandbox.stub(),
        volumeDown: sandbox.stub(),
        switchInput: sandbox.stub(),
        confirm: sandbox.stub(),
        switchToPcInput: sandbox.stub(),
      },
    });

    register({
      id: 'abcdef123456',
      emit: sandbox.stub(),
      on(eventName, handler) {
        handlers.set(eventName, handler);
      },
    });

    await handlers.get('browser:brave')();

    expect(browser.focusOrLaunchBrave.calledOnce).toBe(true);
  });
});
