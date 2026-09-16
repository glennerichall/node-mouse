import {jest} from '@jest/globals';
import {bindKeyboardPanel} from '../../client/ui/main/keyboard-panel.js';
import {REMOTE_EVENT_KEYBOARD_TEXT} from '../../utils/remoteCommands.js';

class FakeElement extends EventTarget {
  constructor() {
    super();
    this.value = '';
    this.attributes = new Map();
    this.classes = new Set();
    this.classList = {
      add: (...names) => names.forEach((name) => this.classes.add(name)),
      remove: (...names) => names.forEach((name) => this.classes.delete(name)),
      contains: (name) => this.classes.has(name),
      toggle: (name, enabled) => enabled
        ? this.classes.add(name)
        : this.classes.delete(name),
    };
  }

  blur() {}
  focus() {}
  scrollIntoView() {}
  setAttribute(name, value) {
    this.attributes.set(name, value);
  }
}

function createInputEvent(type, properties) {
  const event = new Event(type);
  Object.defineProperties(event, Object.fromEntries(
    Object.entries(properties).map(([key, value]) => [key, {value}]),
  ));
  return event;
}

function createFixture() {
  const socket = {emit: jest.fn()};
  const keyboard = {
    keyboardPanel: new FakeElement(),
    keyboardPanelPreview: new FakeElement(),
    keyboardTextMode: new FakeElement(),
    keyboardLiveMode: new FakeElement(),
    textInput: new FakeElement(),
    liveTextInput: new FakeElement(),
    keyboardEsc: new FakeElement(),
    keyboardTab: new FakeElement(),
    keyboardEnter: new FakeElement(),
    keyboardShift: new FakeElement(),
    keyboardAlt: new FakeElement(),
    keyboardCtrl: new FakeElement(),
    btnTextEntry: new FakeElement(),
    btnLiveKeyboard: new FakeElement(),
    btnSendText: new FakeElement(),
  };
  bindKeyboardPanel({
    getTransport: () => socket,
    getAppState: () => ({set: jest.fn()}),
  }, {remotes: {keyboard}});
  return {keyboard, socket};
}

describe('keyboard panel', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.window = Object.assign(new EventTarget(), {
      setTimeout,
      clearTimeout,
    });
    global.document = {body: {offsetHeight: 0}};
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.window;
    delete global.document;
  });

  it('sends Android composition text only once after it is committed', () => {
    const {keyboard, socket} = createFixture();
    const input = keyboard.liveTextInput;

    input.dispatchEvent(createInputEvent('beforeinput', {
      data: 'h',
      inputType: 'insertCompositionText',
      isComposing: true,
    }));
    input.value = 'h';
    input.dispatchEvent(createInputEvent('input', {isComposing: true}));

    input.dispatchEvent(createInputEvent('beforeinput', {
      data: 'hé',
      inputType: 'insertCompositionText',
      isComposing: true,
    }));
    input.value = 'hé';
    input.dispatchEvent(createInputEvent('input', {isComposing: true}));

    input.dispatchEvent(new Event('compositionend'));
    input.dispatchEvent(createInputEvent('input', {isComposing: false}));
    jest.runOnlyPendingTimers();

    expect(socket.emit).toHaveBeenCalledTimes(1);
    expect(socket.emit).toHaveBeenCalledWith(
      REMOTE_EVENT_KEYBOARD_TEXT,
      expect.objectContaining({text: 'hé'}),
    );
    expect(input.value).toBe('');
  });
});
