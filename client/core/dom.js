export function getDom() {
  const app = document.getElementById('app');
  const touchpad = document.getElementById('touchpad');
  const adminDrawerScrim = document.getElementById('admin-drawer-scrim');
  const leftMenu = document.getElementById('left-menu');
  const keyboardPanel = document.getElementById('keyboard-panel');
  const textInput = document.getElementById('text-input');

  const btnKeyboard = document.getElementById('btn-keyboard');
  const btnLeft = document.getElementById('btn-left');
  const btnRight = document.getElementById('btn-right');
  const btnEnter = document.getElementById('btn-enter');
  const btnBackspace = document.getElementById('btn-backspace');
  const btnSendText = document.getElementById('send-text');
  const btnOpenBrave = document.getElementById('btn-open-brave');
  const btnBrowserBack = document.getElementById('btn-browser-back');
  const btnBrowserForward = document.getElementById('btn-browser-forward');
  const btnPrevTab = document.getElementById('btn-prev-tab');
  const btnNextTab = document.getElementById('btn-next-tab');
  const btnNewTab = document.getElementById('btn-new-tab');
  const btnCloseTab = document.getElementById('btn-close-tab');
  const btnAddressBar = document.getElementById('btn-address-bar');
  const btnHardReload = document.getElementById('btn-hard-reload');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const btnSamsungOn = document.getElementById('btn-samsung-on');
  const btnSamsungOff = document.getElementById('btn-samsung-off');
  const btnSamsungVolUp = document.getElementById('btn-samsung-volup');
  const btnSamsungVolDown = document.getElementById('btn-samsung-voldown');
  const btnSamsungInput = document.getElementById('btn-samsung-input');
  const btnSamsungEnter = document.getElementById('btn-samsung-enter');
  const btnSamsungPcInput = document.getElementById('btn-samsung-pc-input');
  const btnForceUpdateCheck = document.getElementById('btn-force-update-check');
  const btnInstallUpdate = document.getElementById('btn-install-update');
  const btnRestartService = document.getElementById('btn-restart-service');
  const btnOpenQrBrowser = document.getElementById('btn-open-qr-browser');
  const btnToggleQrOverlay = document.getElementById('btn-toggle-qr-overlay');
  const btnOpenServerInfoBrowser = document.getElementById('btn-open-server-info-browser');
  const btnRotateEntryToken = document.getElementById('btn-rotate-entry-token');
  const adminAppVersion = document.getElementById('admin-app-version');
  const connectionOverlay = document.getElementById('connection-overlay');
  const notificationsRoot = document.getElementById('client-notifications');
  const previewCanvas = document.getElementById('preview-canvas');
  const cursorPreview = document.getElementById('cursor-preview');

  return {
    app,
    touchpad,
    adminDrawerScrim,
    leftMenu,
    keyboardPanel,
    textInput,
    btnKeyboard,
    btnLeft,
    btnRight,
    btnEnter,
    btnBackspace,
    btnSendText,
    btnOpenBrave,
    btnBrowserBack,
    btnBrowserForward,
    btnPrevTab,
    btnNextTab,
    btnNewTab,
    btnCloseTab,
    btnAddressBar,
    btnHardReload,
    btnFullscreen,
    btnSamsungOn,
    btnSamsungOff,
    btnSamsungVolUp,
    btnSamsungVolDown,
    btnSamsungInput,
    btnSamsungEnter,
    btnSamsungPcInput,
    btnForceUpdateCheck,
    btnInstallUpdate,
    btnRestartService,
    btnOpenQrBrowser,
    btnToggleQrOverlay,
    btnOpenServerInfoBrowser,
    btnRotateEntryToken,
    adminAppVersion,
    connectionOverlay,
    notificationsRoot,
    previewCanvas,
    cursorPreview,
  };
}
