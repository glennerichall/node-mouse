function getElement(id) {
  return document.getElementById(id);
}

function getLayoutDom() {
  return {
    app: getElement('app'),
    touchpad: getElement('touchpad'),
    adminDrawerScrim: getElement('admin-drawer-scrim'),
    leftMenu: getElement('left-menu'),
    keyboardPanel: getElement('keyboard-panel'),
    textInput: getElement('text-input'),
    connectionOverlay: getElement('connection-overlay'),
    notificationsRoot: getElement('client-notifications'),
    previewCanvas: getElement('preview-canvas'),
    cursorPreview: getElement('cursor-preview'),
    adminAppVersion: getElement('admin-app-version'),
  };
}

function getMouseControlsDom() {
  return {
    btnKeyboard: getElement('btn-keyboard'),
    btnLeft: getElement('btn-left'),
    btnRight: getElement('btn-right'),
    btnSendText: getElement('send-text'),
  };
}

function getKeyboardRemoteDom() {
  return {
    btnEnter: getElement('btn-enter'),
    btnBackspace: getElement('btn-backspace'),
  };
}

function getBrowserRemoteDom() {
  return {
    btnOpenBrave: getElement('btn-open-brave'),
    btnBrowserBack: getElement('btn-browser-back'),
    btnBrowserForward: getElement('btn-browser-forward'),
    btnPrevTab: getElement('btn-prev-tab'),
    btnNextTab: getElement('btn-next-tab'),
    btnNewTab: getElement('btn-new-tab'),
    btnCloseTab: getElement('btn-close-tab'),
    btnAddressBar: getElement('btn-address-bar'),
    btnHardReload: getElement('btn-hard-reload'),
    btnFullscreen: getElement('btn-fullscreen'),
  };
}

function getSamsungRemoteDom() {
  return {
    btnSamsungOn: getElement('btn-samsung-on'),
    btnSamsungOff: getElement('btn-samsung-off'),
    btnSamsungVolUp: getElement('btn-samsung-volup'),
    btnSamsungVolDown: getElement('btn-samsung-voldown'),
    btnSamsungInput: getElement('btn-samsung-input'),
    btnSamsungEnter: getElement('btn-samsung-enter'),
    btnSamsungPcInput: getElement('btn-samsung-pc-input'),
  };
}

function getAdminRemoteDom() {
  return {
    btnForceUpdateCheck: getElement('btn-force-update-check'),
    btnInstallUpdate: getElement('btn-install-update'),
    btnRestartService: getElement('btn-restart-service'),
    btnOpenQrBrowserServer: getElement('btn-open-qr-browser-server'),
    btnOpenQrBrowserClient: getElement('btn-open-qr-browser-client'),
    btnToggleQrOverlay: getElement('btn-toggle-qr-overlay'),
    btnOpenServerInfoBrowserServer: getElement('btn-open-server-info-browser-server'),
    btnOpenServerInfoBrowserClient: getElement('btn-open-server-info-browser-client'),
    btnRotateEntryToken: getElement('btn-rotate-entry-token'),
  };
}

export function getDom() {
  return {
    ...getLayoutDom(),
    ...getMouseControlsDom(),
    ...getKeyboardRemoteDom(),
    ...getBrowserRemoteDom(),
    ...getSamsungRemoteDom(),
    ...getAdminRemoteDom(),
  };
}
