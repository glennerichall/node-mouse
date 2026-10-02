import sinon from 'sinon';
import { createKeyboardController } from '../../server/services/input/createKeyboardController.js';

describe('createKeyboardController', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('types plain text directly', () => {
    const desktopController = {
      typeString: sandbox.stub(),
      keyTap: sandbox.stub(),
    };

    const keyboard = createKeyboardController(desktopController);
    keyboard.typeText('abc 123');

    expect(desktopController.typeString.calledOnceWithExactly('abc 123')).toBe(true);
    expect(desktopController.keyTap.called).toBe(false);
  });

  it('types a hyphen directly instead of using Linux unicode composition', () => {
    const desktopController = {
      typeString: sandbox.stub(),
      keyTap: sandbox.stub(),
    };

    const keyboard = createKeyboardController(desktopController);
    keyboard.typeText('-');

    expect(desktopController.typeString.calledOnceWithExactly('-')).toBe(true);
    expect(desktopController.keyTap.called).toBe(false);
  });

  it('uses unicode input for special characters on linux', () => {
    const desktopController = {
      typeString: sandbox.stub(),
      keyTap: sandbox.stub(),
    };

    const keyboard = createKeyboardController(desktopController);
    keyboard.typeText('@');

    expect(desktopController.keyTap.firstCall.args).toEqual(['u', ['control', 'shift']]);
    expect(desktopController.typeString.calledOnceWithExactly('40')).toBe(true);
    expect(desktopController.keyTap.secondCall.args).toEqual(['enter']);
  });

  it('keeps mixed text in order', () => {
    const desktopController = {
      typeString: sandbox.stub(),
      keyTap: sandbox.stub(),
    };

    const keyboard = createKeyboardController(desktopController);
    keyboard.typeText('ab@c');

    expect(desktopController.typeString.firstCall.args).toEqual(['ab']);
    expect(desktopController.keyTap.firstCall.args).toEqual(['u', ['control', 'shift']]);
    expect(desktopController.typeString.secondCall.args).toEqual(['40']);
    expect(desktopController.keyTap.secondCall.args).toEqual(['enter']);
    expect(desktopController.typeString.thirdCall.args).toEqual(['c']);
  });

  it('allows copy and paste keyboard shortcuts', () => {
    const desktopController = {
      typeString: sandbox.stub(),
      keyTap: sandbox.stub(),
    };

    const keyboard = createKeyboardController(desktopController);
    keyboard.pressSpecialKey('c', ['control']);
    keyboard.pressSpecialKey('v', ['control']);

    expect(desktopController.keyTap.firstCall.args).toEqual(['c', ['control']]);
    expect(desktopController.keyTap.secondCall.args).toEqual(['v', ['control']]);
  });
});
