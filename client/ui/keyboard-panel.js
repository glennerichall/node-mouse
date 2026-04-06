import { emitWithTimestamp } from '../core/socket-emit.js';
import {
  REMOTE_EVENT_KEYBOARD_KEY,
  REMOTE_EVENT_KEYBOARD_TEXT,
} from '../../utils/shared/remoteCommands.js';

export function bindKeyboardPanel(socket, {
  keyboardPanel,
  keyboardPanelPreview,
  keyboardTextMode,
  keyboardLiveMode,
  textInput,
  liveTextInput,
  textModeEsc,
  textModeTab,
  textModeShift,
  textModeAlt,
  textModeCtrl,
  liveModeEsc,
  liveModeTab,
  liveModeShift,
  liveModeAlt,
  liveModeCtrl,
  btnTextEntry,
  btnLiveKeyboard,
  btnSendText,
}, {
  setPreviewActive = () => {},
} = {}) {
  const modifierState = {
    control: false,
    alt: false,
    shift: false,
  };
  let activeMode = '';

  function syncModeButtons(mode = '') {
    btnTextEntry.classList.toggle('is-active', mode === 'text');
    btnLiveKeyboard.classList.toggle('is-active', mode === 'live');
  }

  function updatePreview(text = '') {
    if (!keyboardPanelPreview) {
      return;
    }

    keyboardPanelPreview.textContent = text;
    keyboardPanelPreview.classList.toggle('is-empty', !text);
  }

  function closePanel() {
    activeMode = '';
    keyboardPanel.classList.add('hidden');
    keyboardTextMode.classList.remove('hidden');
    keyboardLiveMode.classList.add('hidden');
    textInput.blur();
    liveTextInput.blur();
    modifierState.control = false;
    modifierState.alt = false;
    modifierState.shift = false;
    syncModifierButtons();
    syncModeButtons('');
    setPreviewActive(false);
  }

  function openPanel(mode) {
    activeMode = mode;
    keyboardPanel.classList.remove('hidden');
    keyboardTextMode.classList.toggle('hidden', mode !== 'text');
    keyboardLiveMode.classList.toggle('hidden', mode !== 'live');
    syncModeButtons(mode);
    setPreviewActive(true);

    const target = mode === 'live' ? liveTextInput : textInput;
    updatePreview(mode === 'text' ? textInput.value : '');
    setTimeout(() => target.focus(), 40);
  }

  function togglePanel(mode) {
    const panelHidden = keyboardPanel.classList.contains('hidden');
    const textModeHidden = keyboardTextMode.classList.contains('hidden');
    const currentMode = textModeHidden ? 'live' : 'text';

    if (!panelHidden && currentMode === mode) {
      closePanel();
      return;
    }

    openPanel(mode);
  }

  function sendText() {
    const text = textInput.value;
    if (!text.trim()) {
      return;
    }

    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_TEXT, { text });
    textInput.value = '';
    updatePreview('');
    setPreviewActive(true);
    textInput.focus();
  }

  function sendSpecialKey(key, modifiers) {
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_KEY, { key, modifiers });
  }

  function getActiveModifiers() {
    return Object.entries(modifierState)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
  }

  function syncModifierButtons() {
    const buttonMap = [
      [textModeShift, modifierState.shift],
      [liveModeShift, modifierState.shift],
      [textModeAlt, modifierState.alt],
      [liveModeAlt, modifierState.alt],
      [textModeCtrl, modifierState.control],
      [liveModeCtrl, modifierState.control],
    ];

    for (const [button, active] of buttonMap) {
      button?.classList.toggle('is-active', active);
      button?.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }

  function toggleModifier(modifier) {
    modifierState[modifier] = !modifierState[modifier];
    syncModifierButtons();
    setPreviewActive(true);
  }

  function pressKeyboardAction(key) {
    const modifiers = getActiveModifiers();
    sendSpecialKey(key, modifiers.length ? modifiers : undefined);
    setPreviewActive(true);
    if (modifierState.shift || modifierState.alt || modifierState.control) {
      modifierState.shift = false;
      modifierState.alt = false;
      modifierState.control = false;
      syncModifierButtons();
    }
  }

  btnTextEntry.addEventListener('click', () => togglePanel('text'));
  btnLiveKeyboard.addEventListener('click', () => togglePanel('live'));
  btnSendText.addEventListener('click', sendText);
  textModeEsc.addEventListener('click', () => pressKeyboardAction('escape'));
  liveModeEsc.addEventListener('click', () => pressKeyboardAction('escape'));
  textModeTab.addEventListener('click', () => pressKeyboardAction('tab'));
  liveModeTab.addEventListener('click', () => pressKeyboardAction('tab'));
  textModeShift.addEventListener('click', () => toggleModifier('shift'));
  liveModeShift.addEventListener('click', () => toggleModifier('shift'));
  textModeAlt.addEventListener('click', () => toggleModifier('alt'));
  liveModeAlt.addEventListener('click', () => toggleModifier('alt'));
  textModeCtrl.addEventListener('click', () => toggleModifier('control'));
  liveModeCtrl.addEventListener('click', () => toggleModifier('control'));

  textInput.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      sendText();
    }
  });

  textInput.addEventListener('input', () => {
    updatePreview(textInput.value);
    setPreviewActive(true);
  });

  liveTextInput.addEventListener('beforeinput', (event) => {
    const inputType = String(event.inputType || '');

    if (inputType.startsWith('delete')) {
      event.preventDefault();
      pressKeyboardAction('backspace');
      if (activeMode === 'text') {
        updatePreview(keyboardPanelPreview.textContent.slice(0, -1));
      } else {
        updatePreview('');
      }
      setPreviewActive(true);
      return;
    }

    const text = typeof event.data === 'string' ? event.data : '';
    if (!text) {
      return;
    }

    event.preventDefault();
    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_TEXT, { text });
    updatePreview(activeMode === 'text' ? `${keyboardPanelPreview.textContent}${text}` : '');
    setPreviewActive(true);
  });

  liveTextInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      pressKeyboardAction('enter');
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      pressKeyboardAction('tab');
    }
  });

  liveTextInput.addEventListener('input', () => {
    if (liveTextInput.value) {
      liveTextInput.value = '';
    }
  });

  syncModifierButtons();
  updatePreview('');
}
