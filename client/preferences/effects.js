export function applyThemeToDocument(theme) {
  if (typeof document === 'undefined') {
    return theme;
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  return theme;
}

export function applyHandednessToDocument(handedness) {
  if (typeof document === 'undefined') {
    return handedness;
  }
  document.documentElement.dataset.handedness = handedness;
  return handedness;
}

export function applyRemoteAutoHideToDocument(enabled) {
  if (typeof document === 'undefined') {
    return enabled;
  }
  document.documentElement.dataset.remoteAutoHide = enabled ? 'true' : 'false';
  return enabled;
}
