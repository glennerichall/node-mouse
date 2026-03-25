export function getDom() {
  const touchpad = document.getElementById('touchpad');
  const keyboardPanel = document.getElementById('keyboard-panel');
  const textInput = document.getElementById('text-input');

  const btnKeyboard = document.getElementById('btn-keyboard');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnEnter = document.getElementById('btn-enter');
  const btnBackspace = document.getElementById('btn-backspace');
  const btnSendText = document.getElementById('send-text');
  const btnOpenBrave = document.getElementById('btn-open-brave');
  const btnPrevTab = document.getElementById('btn-prev-tab');
  const btnNextTab = document.getElementById('btn-next-tab');
  const btnNewTab = document.getElementById('btn-new-tab');
  const btnCloseTab = document.getElementById('btn-close-tab');
  const btnAddressBar = document.getElementById('btn-address-bar');
  const btnHardReload = document.getElementById('btn-hard-reload');
  const btnFullscreen = document.getElementById('btn-fullscreen');

  return {
    touchpad,
    keyboardPanel,
    textInput,
    btnKeyboard,
    btnLeft,
    btnRight,
    btnEnter,
    btnBackspace,
    btnSendText,
    btnOpenBrave,
    btnPrevTab,
    btnNextTab,
    btnNewTab,
    btnCloseTab,
    btnAddressBar,
    btnHardReload,
    btnFullscreen,
  };
}
