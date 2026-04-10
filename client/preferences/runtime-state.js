let cachedTheme = '';
let cachedHandedness = '';
let cachedRemoteAutoHide = true;
let cachedRemoteVisibility = {};
let cachedBrowserVisibility = {};

export function getCachedTheme() {
  return cachedTheme;
}

export function setCachedTheme(value) {
  cachedTheme = value;
  return cachedTheme;
}

export function getCachedHandedness() {
  return cachedHandedness;
}

export function setCachedHandedness(value) {
  cachedHandedness = value;
  return cachedHandedness;
}

export function getCachedRemoteAutoHide() {
  return cachedRemoteAutoHide;
}

export function setCachedRemoteAutoHide(value) {
  cachedRemoteAutoHide = value;
  return cachedRemoteAutoHide;
}

export function getCachedRemoteVisibility() {
  return cachedRemoteVisibility;
}

export function setCachedRemoteVisibility(value) {
  cachedRemoteVisibility = value;
  return cachedRemoteVisibility;
}

export function getCachedBrowserVisibility() {
  return cachedBrowserVisibility;
}

export function setCachedBrowserVisibility(value) {
  cachedBrowserVisibility = value;
  return cachedBrowserVisibility;
}
