import { emitWithTimestamp } from '../core/socket-emit.js';
import { REMOTE_EVENT_KEYBOARD_TEXT } from '../../utils/shared/remoteCommands.js';

export function bindKeyboardPanel(socket, { keyboardPanel, textInput, btnKeyboard, btnSendText }) {
  function toggleKeyboard() {
    const hidden = keyboardPanel.classList.toggle('hidden');
    if (!hidden) {
      setTimeout(() => textInput.focus(), 40);
    }
  }

  function sendText() {
    const text = textInput.value;
    if (!text.trim()) {
      return;
    }

    emitWithTimestamp(socket, REMOTE_EVENT_KEYBOARD_TEXT, { text });
    textInput.value = '';
    textInput.focus();
  }

  btnKeyboard.addEventListener('click', toggleKeyboard);
  btnSendText.addEventListener('click', sendText);

  textInput.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      sendText();
    }
  });
}
