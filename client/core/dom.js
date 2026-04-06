function getElement(id) {
  return document.getElementById(id);
}

function getLayoutDom() {
  return {
    app: getElement('app'),
    touchpad: getElement('touchpad'),
    adminDrawerScrim: getElement('admin-drawer-scrim'),
    leftMenu: getElement('left-menu'),
    remoteStack: getElement('remote-stack'),
    browserShortcuts: getElement('browser-shortcuts'),
    tvControls: getElement('tv-controls'),
    keyboardPanel: getElement('keyboard-panel'),
    keyboardPanelPreview: getElement('keyboard-panel-preview'),
    keyboardTextMode: getElement('keyboard-text-mode'),
    keyboardLiveMode: getElement('keyboard-live-mode'),
    textInput: getElement('text-input'),
    liveTextInput: getElement('live-text-input'),
    textModeEsc: getElement('text-mode-esc'),
    textModeTab: getElement('text-mode-tab'),
    textModeShift: getElement('text-mode-shift'),
    textModeAlt: getElement('text-mode-alt'),
    textModeCtrl: getElement('text-mode-ctrl'),
    liveModeEsc: getElement('live-mode-esc'),
    liveModeTab: getElement('live-mode-tab'),
    liveModeShift: getElement('live-mode-shift'),
    liveModeAlt: getElement('live-mode-alt'),
    liveModeCtrl: getElement('live-mode-ctrl'),
    connectionOverlay: getElement('connection-overlay'),
    notificationsRoot: getElement('client-notifications'),
    previewCanvas: getElement('preview-canvas'),
    cursorPreview: getElement('cursor-preview'),
    adminActionsDisabledMessage: getElement('admin-actions-disabled-message'),
    adminAppVersion: getElement('admin-app-version'),
  };
}

function getMouseControlsDom() {
  return {
    btnTextEntry: getElement('btn-text-entry'),
    btnLiveKeyboard: getElement('btn-live-keyboard'),
    btnSendText: getElement('send-text'),
  };
}

function getKeyboardRemoteDom() {
  return {};
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
    btnOpenConfigPage: getElement('btn-open-config-page'),
    btnOpenPreferencesPage: getElement('btn-open-preferences-page'),
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
