import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function trimSlashes(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '');
}

function createRandomToken(length) {
  const safeLength = clamp(Math.floor(length), 8, 128);
  let token = '';
  while (token.length < safeLength) {
    token += crypto.randomBytes(24).toString('base64url');
  }
  return token.slice(0, safeLength);
}

function isTokenFormatValid(token) {
  return /^[A-Za-z0-9_-]{8,128}$/.test(String(token || ''));
}

function ensureDirForFile(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function parseState(raw) {
  try {
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const currentToken = trimSlashes(payload.currentToken || '');
    if (!isTokenFormatValid(currentToken)) {
      return null;
    }

    const tokens = new Map();
    const entries = Array.isArray(payload.tokens) ? payload.tokens : [];
    for (const entry of entries) {
      if (!Array.isArray(entry) || entry.length !== 2) {
        continue;
      }
      const token = trimSlashes(entry[0] || '');
      const createdAt = Number(entry[1]);
      if (!isTokenFormatValid(token) || !Number.isFinite(createdAt) || createdAt <= 0) {
        continue;
      }
      tokens.set(token, Math.floor(createdAt));
    }

    if (!tokens.has(currentToken)) {
      const currentCreatedAt = Number(payload.currentCreatedAt);
      tokens.set(
        currentToken,
        Number.isFinite(currentCreatedAt) && currentCreatedAt > 0
          ? Math.floor(currentCreatedAt)
          : Date.now(),
      );
    }

    return { currentToken, tokens };
  } catch (_error) {
    return null;
  }
}

function loadPersistedState(stateFilePath) {
  if (!stateFilePath || !fs.existsSync(stateFilePath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(stateFilePath, 'utf8');
    return parseState(raw);
  } catch (_error) {
    return null;
  }
}

function savePersistedState(stateFilePath, { currentToken, tokens }) {
  if (!stateFilePath) {
    return;
  }

  try {
    ensureDirForFile(stateFilePath);
    const payload = {
      version: 1,
      updatedAt: Date.now(),
      currentToken,
      currentCreatedAt: tokens.get(currentToken) || Date.now(),
      tokens: Array.from(tokens.entries()),
    };
    fs.writeFileSync(stateFilePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  } catch (error) {
    console.warn(`Entry token state save failed: ${error.message}`);
  }
}

export function createEntryTokenManager({
  enabled,
  fixedPath,
  tokenLength,
  rotateIntervalMin,
  graceMin,
  stateFilePath,
}) {
  const normalizedFixedPath = trimSlashes(fixedPath);
  const effectiveEnabled = Boolean(enabled);
  const gateEnabled = effectiveEnabled || Boolean(normalizedFixedPath);
  const persistenceEnabled = effectiveEnabled && !normalizedFixedPath;

  const tokens = new Map();
  let currentToken = '';

  function persistState() {
    if (!persistenceEnabled) {
      return;
    }
    savePersistedState(stateFilePath, { currentToken, tokens });
  }

  if (normalizedFixedPath) {
    currentToken = normalizedFixedPath;
    tokens.set(currentToken, Date.now());
  } else if (effectiveEnabled) {
    const restored = loadPersistedState(stateFilePath);
    if (restored) {
      currentToken = restored.currentToken;
      for (const [token, createdAt] of restored.tokens.entries()) {
        tokens.set(token, createdAt);
      }
    }

    if (!currentToken) {
      currentToken = createRandomToken(tokenLength);
      tokens.set(currentToken, Date.now());
    }

    if (!tokens.has(currentToken)) {
      tokens.set(currentToken, Date.now());
    }

    persistState();
  }

  function getCurrentToken() {
    return currentToken;
  }

  function getEntryPath() {
    if (!gateEnabled) {
      return currentToken ? `/${currentToken}` : '';
    }
    return `/${currentToken}`;
  }

  function getEntryUrl(basePublicUrl) {
    const entryPath = getEntryPath();
    if (!entryPath) {
      return basePublicUrl;
    }
    return `${basePublicUrl}${entryPath}/`;
  }

  function cleanupExpired({ persist = false } = {}) {
    if (!gateEnabled || normalizedFixedPath) {
      return;
    }
    const ttlMs = Math.max(60_000, graceMin * 60_000);
    const now = Date.now();
    let changed = false;
    for (const [token, createdAt] of tokens.entries()) {
      if (token === currentToken) {
        continue;
      }
      if (now - createdAt > ttlMs) {
        tokens.delete(token);
        changed = true;
      }
    }
    if (changed && persist) {
      persistState();
    }
  }

  function rotate() {
    if (!effectiveEnabled || normalizedFixedPath) {
      return currentToken;
    }
    currentToken = createRandomToken(tokenLength);
    tokens.set(currentToken, Date.now());
    cleanupExpired({ persist: false });
    persistState();
    return currentToken;
  }

  function isValid(token) {
    const normalized = trimSlashes(token);
    if (!gateEnabled) {
      if (!currentToken) {
        return true;
      }
      if (!normalized) {
        return false;
      }
      return normalized === currentToken;
    }
    if (!normalized) {
      return false;
    }
    cleanupExpired({ persist: false });
    return tokens.has(normalized);
  }

  function extractTokenAndSuffix(url) {
    const source = String(url || '');
    const [pathname, query = ''] = source.split('?');
    const segments = pathname.split('/').filter(Boolean);
    const token = segments[0] || '';
    const suffixPath = `/${segments.slice(1).join('/')}`;
    const suffix = query ? `${suffixPath}?${query}` : suffixPath;
    return { token, suffix };
  }

  function makeHttpGuardMiddleware() {
    if (!gateEnabled) {
      return (_req, _res, next) => next();
    }

    return (req, res, next) => {
      const { token, suffix } = extractTokenAndSuffix(req.url || req.originalUrl);
      if (!isValid(token)) {
        res.status(404).type('text/plain').send('Not found');
        return;
      }

      req.url = suffix === '' ? '/' : suffix;
      next();
    };
  }

  function startAutoRotation(onRotate) {
    if (!gateEnabled || normalizedFixedPath) {
      return { stop: () => {} };
    }

    const intervalMs = Math.max(60_000, rotateIntervalMin * 60_000);
    let stopped = false;
    let timer = null;

    function invokeRotateCallback(token) {
      if (!onRotate) {
        return;
      }
      try {
        const maybePromise = onRotate(token);
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.catch((error) => {
            console.error(`Entry token rotate callback failed: ${error.message}`);
          });
        }
      } catch (error) {
        console.error(`Entry token rotate callback failed: ${error.message}`);
      }
    }

    function scheduleNext() {
      if (stopped) {
        return;
      }

      const issuedAt = tokens.get(currentToken) || Date.now();
      const elapsed = Date.now() - issuedAt;
      const waitMs = elapsed >= intervalMs
        ? 50
        : Math.max(50, intervalMs - elapsed);

      timer = setTimeout(() => {
        if (stopped) {
          return;
        }
        const token = rotate();
        invokeRotateCallback(token);
        scheduleNext();
      }, waitMs);
    }

    scheduleNext();

    return {
      stop() {
        stopped = true;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
    };
  }

  return {
    enabled: gateEnabled,
    getCurrentToken,
    getEntryPath,
    getEntryUrl,
    isValid,
    rotate,
    makeHttpGuardMiddleware,
    startAutoRotation,
  };
}
