export function applyRemoteVisibilityState({
  services,
  dom,
}) {
  const {remotes} = dom;
  const configView = services.getConfigView();
  const preferenceView = services.getPreferenceView();
  
  const browserVisible = configView.getBrowserConfig().enabled !== false
    && preferenceView.getRemoteVisibility('browser', true);
  
  const keyboardVisible = configView.getKeyboardConfig().enabled !== false
    && preferenceView.getRemoteVisibility('keyboard', true);
  
  const vlcVisible = configView.getVlcConfig().enabled !== false
    && preferenceView.getRemoteVisibility('vlc', true);
  
  const samsungVisible = preferenceView.getRemoteVisibility('samsung', true);
  
  const previewVisible = configView.getPreviewConfig().enabled !== false
    && preferenceView.getRemoteVisibility('preview', true);

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
