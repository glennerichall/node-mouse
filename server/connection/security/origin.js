const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function normalizeOrigin(value) {
  try {
    const url = new URL(String(value || ''));
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
      return '';
    }
    return url.origin;
  } catch (_error) {
    return '';
  }
}

export function isOriginAllowed(origin, expectedOrigin, allowedOrigins = []) {
  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) {
    return false;
  }

  const allowed = new Set([
    normalizeOrigin(expectedOrigin),
    ...(Array.isArray(allowedOrigins) ? allowedOrigins : []),
  ].filter(Boolean));
  return allowed.has(normalizedOrigin);
}

export function httpOriginGuard(req, res, next) {
  const origin = req.get('origin');
  if (!origin) {
    next();
    return;
  }

  const expectedOrigin = `${req.protocol}://${req.get('host')}`;
  if (!isOriginAllowed(origin, expectedOrigin, req.services.getSystemConfig().allowedOrigins)) {
    res.status(403).json({ok: false, message: 'Origine non autorisée.'});
    return;
  }

  res.set('Access-Control-Allow-Origin', normalizeOrigin(origin));
  res.set('Access-Control-Allow-Credentials', 'true');
  res.vary('Origin');

  if (String(req.method || '').toUpperCase() === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS');
    res.set('Access-Control-Allow-Headers', req.get('access-control-request-headers') || 'Content-Type');
    res.status(204).end();
    return;
  }

  next();
}

export function sessionCsrfGuard(req, res, next) {
  if (SAFE_METHODS.has(String(req.method || '').toUpperCase())
      || req.securityContext?.authenticationMethod !== 'session'
      || req.get('origin')) {
    next();
    return;
  }
  res.status(403).json({ok: false, message: 'Origine requise pour cette opération.'});
}
