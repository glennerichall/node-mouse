import sinon from 'sinon';
import { createKeyboardController } from '../../server/remotes/input/keyboard-controller.js';

describe('createKeyboardController', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('types plain text directly', () => {
    const robot = {
      typeString: sandbox.stub(),
      keyTap: sandbox.stub(),
    };

    const keyboard = createKeyboardController(robot);
    keyboard.typeText('abc 123');

    expect(robot.typeString.calledOnceWithExactly('abc 123')).toBe(true);
    expect(robot.keyTap.called).toBe(false);
  });

  it('uses unicode input for special characters on linux', () => {
    const robot = {
      typeString: sandbox.stub(),
      keyTap: sandbox.stub(),
    };

    const keyboard = createKeyboardController(robot);
    keyboard.typeText('@');

    expect(robot.keyTap.firstCall.args).toEqual(['u', ['control', 'shift']]);
    expect(robot.typeString.calledOnceWithExactly('40')).toBe(true);
    expect(robot.keyTap.secondCall.args).toEqual(['enter']);
  });

  it('keeps mixed text in order', () => {
    const robot = {
      typeString: sandbox.stub(),
      keyTap: sandbox.stub(),
    };

    const keyboard = createKeyboardController(robot);
    keyboard.typeText('ab@c');

    expect(robot.typeString.firstCall.args).toEqual(['ab']);
    expect(robot.keyTap.firstCall.args).toEqual(['u', ['control', 'shift']]);
    expect(robot.typeString.secondCall.args).toEqual(['40']);
    expect(robot.keyTap.secondCall.args).toEqual(['enter']);
    expect(robot.typeString.thirdCall.args).toEqual(['c']);
  });
});
