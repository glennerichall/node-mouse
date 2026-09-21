import {jest} from '@jest/globals';
import {bindKeyboardPanel} from '../../client/ui/main/keyboard-panel.js';
import {
  REMOTE_EVENT_KEYBOARD_KEY,
  REMOTE_EVENT_KEYBOARD_TEXT,
} from '../../utils/remoteCommands.js';

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
    keyboardCopy: new FakeElement(),
    keyboardPaste: new FakeElement(),
    keyboardLeft: new FakeElement(),
    keyboardUp: new FakeElement(),
    keyboardDown: new FakeElement(),
    keyboardRight: new FakeElement(),
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

  it('sends Android composition text incrementally without duplicating the commit', () => {
    const {keyboard, socket} = createFixture();
    const input = keyboard.liveTextInput;

    input.dispatchEvent(new Event('compositionstart'));
    input.dispatchEvent(createInputEvent('beforeinput', {
      data: 'h',
      inputType: 'insertCompositionText',
      isComposing: true,
    }));
    input.value = 'h';
    input.dispatchEvent(createInputEvent('input', {isComposing: true}));
    expect(socket.emit).toHaveBeenCalledWith(
      REMOTE_EVENT_KEYBOARD_TEXT,
      expect.objectContaining({text: 'h'}),
    );

    input.dispatchEvent(createInputEvent('beforeinput', {
      data: 'hé',
      inputType: 'insertCompositionText',
      isComposing: true,
    }));
    input.value = 'hé';
    input.dispatchEvent(createInputEvent('input', {isComposing: true}));

    input.dispatchEvent(createInputEvent('compositionend', {data: 'hé'}));
    input.dispatchEvent(createInputEvent('input', {isComposing: false}));
    jest.runOnlyPendingTimers();

    const transmittedText = socket.emit.mock.calls
      .filter(([eventName]) => eventName === REMOTE_EVENT_KEYBOARD_TEXT)
      .map(([, payload]) => payload.text)
      .join('');
    expect(transmittedText).toBe('hé');
    expect(input.value).toBe('');
  });

  it('applies an active modifier to the next directly typed key', () => {
    const {keyboard, socket} = createFixture();

    keyboard.keyboardCtrl.dispatchEvent(new Event('click'));
    keyboard.liveTextInput.value = 'c';
    keyboard.liveTextInput.dispatchEvent(createInputEvent('input', {isComposing: false}));

    expect(socket.emit).toHaveBeenCalledWith(
      REMOTE_EVENT_KEYBOARD_KEY,
      expect.objectContaining({key: 'c', modifiers: ['control']}),
    );
    expect(socket.emit).not.toHaveBeenCalledWith(
      REMOTE_EVENT_KEYBOARD_TEXT,
      expect.objectContaining({text: 'c'}),
    );
  });

  it('provides dedicated copy and paste shortcuts', () => {
    const {keyboard, socket} = createFixture();

    keyboard.keyboardCopy.dispatchEvent(new Event('click'));
    keyboard.keyboardPaste.dispatchEvent(new Event('click'));

    const shortcutPayloads = socket.emit.mock.calls
      .filter(([eventName]) => eventName === REMOTE_EVENT_KEYBOARD_KEY)
      .map(([, payload]) => payload);
    expect(shortcutPayloads).toEqual([
      expect.objectContaining({key: 'c', modifiers: ['control']}),
      expect.objectContaining({key: 'v', modifiers: ['control']}),
    ]);
  });

  it('provides dedicated arrow keys', () => {
    const {keyboard, socket} = createFixture();

    keyboard.keyboardLeft.dispatchEvent(new Event('click'));
    keyboard.keyboardUp.dispatchEvent(new Event('click'));
    keyboard.keyboardDown.dispatchEvent(new Event('click'));
    keyboard.keyboardRight.dispatchEvent(new Event('click'));

    const arrowPayloads = socket.emit.mock.calls
      .filter(([eventName]) => eventName === REMOTE_EVENT_KEYBOARD_KEY)
      .map(([, payload]) => payload.key);
    expect(arrowPayloads).toEqual(['left', 'up', 'down', 'right']);
  });
});
