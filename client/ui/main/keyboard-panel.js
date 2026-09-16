import { emitWithTimestamp } from '../../core/socket-emit.js';
import {
  REMOTE_EVENT_KEYBOARD_KEY,
  REMOTE_EVENT_KEYBOARD_TEXT,
} from '../../../utils/remoteCommands.js';
import {APP_STATE_KEYBOARD_PREVIEW_ACTIVE} from '../../services/app-state/createAppStateService.js';

export function bindKeyboardPanel(services, dom) {
  const socket = services.getTransport();
  const appState = services.getAppState();
  const {
    keyboardPanel,
    keyboardPanelPreview,
    keyboardTextMode,
    keyboardLiveMode,
    textInput,
    liveTextInput,
    keyboardEsc,
    keyboardTab,
    keyboardEnter,
    keyboardShift,
    keyboardAlt,
    keyboardCtrl,
    keyboardCopy,
    keyboardPaste,
    btnTextEntry,
    btnLiveKeyboard,
    btnSendText,
  } = dom.remotes.keyboard;
  const modifierState = {
    control: false,
    alt: false,
    shift: false,
  };
  let activeMode = '';
  let compositionFallbackTimer = null;
  let mirroredCompositionText = '';
  let compositionCommitPending = false;

  function setPreviewActive(active) {
    appState.set(APP_STATE_KEYBOARD_PREVIEW_ACTIVE, Boolean(active));
  }

  function forceViewportLayout(input) {
    if (!input) {
      return;
    }

    const run = () => {
      // Force a layout read before asking the browser to reposition the field.
      void document.body.offsetHeight;
      input.scrollIntoView({
        block: 'end',
        inline: 'nearest',
      });
      window.dispatchEvent(new Event('resize'));
    };

    window.setTimeout(run, 50);
    window.setTimeout(run, 250);
  }

  function getActiveInput() {
    return activeMode === 'live' ? liveTextInput : textInput;
  }

  function restoreInputFocus() {
    const input = getActiveInput();
    if (!input || keyboardPanel.classList.contains('hidden')) {
      return;
    }

    window.setTimeout(() => {
      input.focus();
    }, 0);
  }

  function preserveKeyboard(button) {
    if (!button) {
      return;
    }

    const handleMouseDown = (event) => {
      event.preventDefault();
    };

    button.addEventListener('mousedown', handleMouseDown);
  }

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
    updatePreview('');
    setTimeout(() => {
      target.focus();
      forceViewportLayout(target);
    }, 40);
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

  function emitLiveText(text) {
    if (!text) {
      return;
    }

    const characters = Array.from(text);
    if (getActiveModifiers().length > 0 && /^[a-zA-Z0-9]$/.test(characters[0] || '')) {
      pressKeyboardAction(characters.shift().toLowerCase());
    }
    if (characters.length > 0) {
      emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_TEXT, { text: characters.join('') });
    }
    setPreviewActive(true);
  }

  function sendLiveText() {
    emitLiveText(liveTextInput.value);
    liveTextInput.value = '';
  }

  function syncCompositionText(text = liveTextInput.value) {
    const previousCharacters = Array.from(mirroredCompositionText);
    const nextCharacters = Array.from(text);
    let commonLength = 0;

    while (
      commonLength < previousCharacters.length
      && commonLength < nextCharacters.length
      && previousCharacters[commonLength] === nextCharacters[commonLength]
    ) {
      commonLength += 1;
    }

    for (let index = commonLength; index < previousCharacters.length; index += 1) {
      sendSpecialKey('backspace');
    }
    emitLiveText(nextCharacters.slice(commonLength).join(''));
    mirroredCompositionText = nextCharacters.join('');
  }

  function resetComposition() {
    mirroredCompositionText = '';
    compositionCommitPending = false;
    liveTextInput.value = '';
  }

  function getActiveModifiers() {
    return Object.entries(modifierState)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key);
  }

  function syncModifierButtons() {
    const buttonMap = [
      [keyboardShift, modifierState.shift],
      [keyboardAlt, modifierState.alt],
      [keyboardCtrl, modifierState.control],
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
    restoreInputFocus();
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
    restoreInputFocus();
  }

  function pressKeyboardShortcut(key, modifiers) {
    sendSpecialKey(key, modifiers);
    setPreviewActive(true);
    restoreInputFocus();
  }

  [
    keyboardEsc,
    keyboardTab,
    keyboardEnter,
    keyboardShift,
    keyboardAlt,
    keyboardCtrl,
    keyboardCopy,
    keyboardPaste,
    btnSendText,
  ].forEach(preserveKeyboard);

  btnTextEntry.addEventListener('click', () => togglePanel('text'));
  btnLiveKeyboard.addEventListener('click', () => togglePanel('live'));
  btnSendText.addEventListener('click', sendText);
  keyboardEsc.addEventListener('click', () => pressKeyboardAction('escape'));
  keyboardTab.addEventListener('click', () => pressKeyboardAction('tab'));
  keyboardEnter.addEventListener('click', () => pressKeyboardAction('enter'));
  keyboardShift.addEventListener('click', () => toggleModifier('shift'));
  keyboardAlt.addEventListener('click', () => toggleModifier('alt'));
  keyboardCtrl.addEventListener('click', () => toggleModifier('control'));
  keyboardCopy.addEventListener('click', () => pressKeyboardShortcut('c', ['control']));
  keyboardPaste.addEventListener('click', () => pressKeyboardShortcut('v', ['control']));

  textInput.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      sendText();
    }
  });

  textInput.addEventListener('input', () => {
    setPreviewActive(true);
  });

  textInput.addEventListener('focus', () => {
    forceViewportLayout(textInput);
  });

  liveTextInput.addEventListener('beforeinput', (event) => {
    const inputType = String(event.inputType || '');

    if (inputType.startsWith('delete') && !event.isComposing) {
      pressKeyboardAction('backspace');
      setPreviewActive(true);
    }
  });

  liveTextInput.addEventListener('input', (event) => {
    if (event.isComposing) {
      syncCompositionText();
      return;
    }

    if (compositionFallbackTimer) {
      window.clearTimeout(compositionFallbackTimer);
      compositionFallbackTimer = null;
    }
    if (compositionCommitPending || mirroredCompositionText) {
      syncCompositionText();
      resetComposition();
      return;
    }
    sendLiveText();
  });

  liveTextInput.addEventListener('compositionstart', () => {
    mirroredCompositionText = '';
    compositionCommitPending = false;
  });

  liveTextInput.addEventListener('compositionend', (event) => {
    const committedText = liveTextInput.value || (typeof event.data === 'string' ? event.data : '');
    syncCompositionText(committedText);
    compositionCommitPending = true;
    compositionFallbackTimer = window.setTimeout(() => {
      compositionFallbackTimer = null;
      resetComposition();
    }, 0);
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

  liveTextInput.addEventListener('focus', () => {
    forceViewportLayout(liveTextInput);
  });

  syncModifierButtons();
  updatePreview('');
}
