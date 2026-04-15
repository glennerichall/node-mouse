import {
  SUPPORTED_HANDEDNESS,
  SUPPORTED_THEMES,
} from '../../preferences/constants.js';

export function normalizeString(value, fallback = '') {
  const normalized = String(value ?? '').trim();
  return normalized || fallback;
}

export function normalizeTheme(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return SUPPORTED_THEMES.has(normalized) ? normalized : 'dark';
}

export function normalizeHandedness(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return SUPPORTED_HANDEDNESS.has(normalized) ? normalized : 'right';
}

export function normalizeRemoteAutoHide(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return !(normalized === 'false' || normalized === '0' || normalized === 'off' || normalized === 'no');
}

export function normalizeBooleanRecord(value, fallback = {}) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, Boolean(entryValue)]),
    );
  }

  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return fallback;
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([key, entryValue]) => [key, Boolean(entryValue)]),
    );
  } catch (_error) {
    return fallback;
  }
}

export function normalizeRemoteVisibilityState(value) {
  const nextState = normalizeBooleanRecord(value);
  if (Object.keys(nextState).length > 0) {
    return nextState;
  }

  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'false' || normalized === '0' || normalized === 'off') {
    return {
      browser: false,
      samsung: false,
      preview: false,
    };
  }

  return {};
}
