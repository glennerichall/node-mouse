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
    scrollZoneIndicator: getElement('scroll-zone-indicator'),
    browserShortcuts: getElement('browser-shortcuts'),
    tvControls: getElement('tv-controls'),
    vlcControls: getElement('vlc-controls'),
    systemControls: getElement('system-controls'),
    menu: getElement('menu'),
    keyboardPanel: getElement('keyboard-panel'),
    keyboardShortcutsBar: getElement('keyboard-shortcuts-bar'),
    keyboardPanelPreview: getElement('keyboard-panel-preview'),
    keyboardTextMode: getElement('keyboard-text-mode'),
    keyboardLiveMode: getElement('keyboard-live-mode'),
    textInput: getElement('text-input'),
    liveTextInput: getElement('live-text-input'),
    keyboardEsc: getElement('keyboard-esc'),
    keyboardTab: getElement('keyboard-tab'),
    keyboardEnter: getElement('keyboard-enter'),
    keyboardShift: getElement('keyboard-shift'),
    keyboardAlt: getElement('keyboard-alt'),
    keyboardCtrl: getElement('keyboard-ctrl'),
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
    browserLaunchers: getElement('browser-launchers'),
    btnBrowserBack: getElement('btn-browser-back'),
    btnBrowserForward: getElement('btn-browser-forward'),
    btnPrevTab: getElement('btn-prev-tab'),
    btnNextTab: getElement('btn-next-tab'),
    btnNewTab: getElement('btn-new-tab'),
    btnCloseTab: getElement('btn-close-tab'),
    btnAddressBar: getElement('btn-address-bar'),
    btnHardReload: getElement('btn-hard-reload'),
    btnFullscreen: getElement('btn-fullscreen'),
    btnVideoPlayPause: getElement('btn-video-play-pause'),
    btnVideoMute: getElement('btn-video-mute'),
    btnVideoFullscreen: getElement('btn-video-fullscreen'),
  };
}

function getSystemRemoteDom() {
  return {
    btnSystemShowDesktop: getElement('btn-system-show-desktop'),
    btnSystemWindowLeft: getElement('btn-system-window-left'),
    btnSystemWindowRight: getElement('btn-system-window-right'),
    btnSystemStartMenu: getElement('btn-system-start-menu'),
    btnSystemWindowToggle: getElement('btn-system-window-toggle'),
    btnSystemWindowClose: getElement('btn-system-window-close'),
  };
}

function getVlcRemoteDom() {
  return {
    btnVlcOpen: getElement('btn-vlc-open'),
    btnVlcWindowToggle: getElement('btn-vlc-window-toggle'),
    btnVlcWindowClose: getElement('btn-vlc-window-close'),
    btnVlcPrevious: getElement('btn-vlc-previous'),
    btnVlcPlayPause: getElement('btn-vlc-play-pause'),
    btnVlcNext: getElement('btn-vlc-next'),
    btnVlcSeekBackward: getElement('btn-vlc-seek-backward'),
    btnVlcStop: getElement('btn-vlc-stop'),
    btnVlcSeekForward: getElement('btn-vlc-seek-forward'),
    btnVlcVolumeDown: getElement('btn-vlc-volume-down'),
    btnVlcMute: getElement('btn-vlc-mute'),
    btnVlcVolumeUp: getElement('btn-vlc-volume-up'),
    btnVlcFullscreen: getElement('btn-vlc-fullscreen'),
  };
}

function getSamsungRemoteDom() {
  return {
    btnSamsungOn: getElement('btn-samsung-on'),
    btnSamsungOff: getElement('btn-samsung-off'),
    btnSamsungVolUp: getElement('btn-samsung-volup'),
    btnSamsungVolDown: getElement('btn-samsung-voldown'),
    btnSamsungMute: getElement('btn-samsung-mute'),
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
    ...getSystemRemoteDom(),
    ...getVlcRemoteDom(),
    ...getSamsungRemoteDom(),
    ...getAdminRemoteDom(),
  };
}
