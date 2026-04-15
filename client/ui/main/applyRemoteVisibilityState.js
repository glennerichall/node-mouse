import {
  APP_STATE_EFFECTIVE_BROWSER_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_KEYBOARD_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_PREVIEW_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_SAMSUNG_REMOTE_VISIBLE,
  APP_STATE_EFFECTIVE_VLC_REMOTE_VISIBLE,
} from '../../services/app-state/createAppStateService.js';

export function applyRemoteVisibilityState({
  services,
  dom,
}) {
  const {remotes} = dom;
  const appState = services.getAppState();
  
  const browserVisible = appState.get(APP_STATE_EFFECTIVE_BROWSER_REMOTE_VISIBLE);
  
  const keyboardVisible = appState.get(APP_STATE_EFFECTIVE_KEYBOARD_REMOTE_VISIBLE);
  
  const vlcVisible = appState.get(APP_STATE_EFFECTIVE_VLC_REMOTE_VISIBLE);
  
  const samsungVisible = appState.get(APP_STATE_EFFECTIVE_SAMSUNG_REMOTE_VISIBLE);
  
  const previewVisible = appState.get(APP_STATE_EFFECTIVE_PREVIEW_REMOTE_VISIBLE);

  if (remotes.browser.root) {
    remotes.browser.root.hidden = !browserVisible;
  }
  dom.app?.classList.toggle('keyboard-remote-hidden', !keyboardVisible);
  
  if (remotes.keyboard.menu) {
    remotes.keyboard.menu.style.display = keyboardVisible ? '' : 'none';
  }
  
  if (remotes.keyboard.keyboardShortcutsBar) {
    remotes.keyboard.keyboardShortcutsBar.style.display = keyboardVisible ? '' : 'none';
  }
  
  if (remotes.keyboard.keyboardPanel) {
    if (!keyboardVisible) {
      remotes.keyboard.keyboardPanel.classList.add('hidden');
    }
    remotes.keyboard.keyboardPanel.style.display = keyboardVisible ? '' : 'none';
  }
  
  if (remotes.samsung.root) {
    remotes.samsung.root.hidden = !samsungVisible;
  }
  
  if (remotes.vlc.root) {
    remotes.vlc.root.hidden = !vlcVisible;
  }
  
  if (remotes.preview.root) {
    remotes.preview.root.hidden = !previewVisible;
    if (!previewVisible) {
      remotes.preview.root.classList.remove('is-visible');
    }
  }
}
