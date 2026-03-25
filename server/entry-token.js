import crypto from 'crypto';

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

export function createEntryTokenManager({
  enabled,
  fixedPath,
  tokenLength,
  rotateIntervalMin,
  graceMin,
}) {
  const normalizedFixedPath = trimSlashes(fixedPath);
  const effectiveEnabled = Boolean(enabled);
  const gateEnabled = effectiveEnabled || Boolean(normalizedFixedPath);
  const tokens = new Map();

  let currentToken = '';

  if (normalizedFixedPath) {
    currentToken = normalizedFixedPath;
    tokens.set(currentToken, Date.now());
  } else if (effectiveEnabled) {
    currentToken = createRandomToken(tokenLength);
    tokens.set(currentToken, Date.now());
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

  function cleanupExpired() {
    if (!gateEnabled || normalizedFixedPath) {
      return;
    }
    const ttlMs = Math.max(60_000, graceMin * 60_000);
    const now = Date.now();
    for (const [token, createdAt] of tokens.entries()) {
      if (token === currentToken) {
        continue;
      }
      if (now - createdAt > ttlMs) {
        tokens.delete(token);
      }
    }
  }

  function rotate() {
    if (!effectiveEnabled || normalizedFixedPath) {
      return currentToken;
    }
    currentToken = createRandomToken(tokenLength);
    tokens.set(currentToken, Date.now());
    cleanupExpired();
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
    cleanupExpired();
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
    const timer = setInterval(() => {
      const token = rotate();
      if (onRotate) {
        onRotate(token);
      }
    }, intervalMs);

    return {
      stop() {
        clearInterval(timer);
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
