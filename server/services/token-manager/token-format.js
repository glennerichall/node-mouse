export function normalizeToken(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '');
}

export function isTokenFormatValid(token) {
  return /^[A-Za-z0-9_-]{8,128}$/.test(String(token || ''));
}
