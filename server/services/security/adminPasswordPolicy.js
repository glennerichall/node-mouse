export const DEFAULT_ADMIN_PASSWORD_MIN_LENGTH = 8;

export function getAdminPasswordMinLength(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_ADMIN_PASSWORD_MIN_LENGTH;
  }
  return Math.max(4, Math.min(128, Math.trunc(parsed)));
}

export function isAdminPasswordConfigured(adminConfig = {}) {
  return String(adminConfig.password || '').length
    >= getAdminPasswordMinLength(adminConfig.passwordMinLength);
}
