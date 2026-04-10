export function applyThemeToDocument(theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  return theme;
}

export function applyHandednessToDocument(handedness) {
  document.documentElement.dataset.handedness = handedness;
  return handedness;
}

export function applyRemoteAutoHideToDocument(enabled) {
  document.documentElement.dataset.remoteAutoHide = enabled ? 'true' : 'false';
  return enabled;
}

