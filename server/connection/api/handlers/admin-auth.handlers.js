import {createHash, timingSafeEqual} from 'node:crypto';
import {
  getAdminPasswordMinLength,
  isAdminPasswordConfigured,
} from '../../../services/security/adminPasswordPolicy.js';

function passwordMatches(actual, expected) {
  const actualHash = createHash('sha256').update(String(actual || '')).digest();
  const expectedHash = createHash('sha256').update(String(expected || '')).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export function createAdminElevation(req, res) {
  const config = req.services.getSystemConfig();
  const expected = String(config.admin?.password || '');
  const password = String(req.body?.password || '');
  const sessionId = req.securityContext?.deviceSessionId;

  if (!sessionId || req.securityContext?.authenticationMethod !== 'session') {
    res.status(400).json({ok: false, message: 'Une session appareil est requise.'});
    return;
  }
  if (!isAdminPasswordConfigured(config.admin)) {
    const minimum = getAdminPasswordMinLength(config.admin?.passwordMinLength);
    res.status(503).json({
      ok: false,
      message: `Le mot de passe administrateur doit contenir au moins ${minimum} caractères.`,
    });
    return;
  }
  if (!passwordMatches(password, expected)) {
    res.status(401).json({ok: false, message: 'Mot de passe administrateur invalide.'});
    return;
  }

  const minutes = Math.max(1, Math.min(120, Number(config.admin?.unlockMinutes || 15)));
  const adminUntil = req.services.getDeviceSessionService().elevateSession(sessionId, minutes * 60_000);
  res.json({ok: true, adminUntil});
}

export function deleteAdminElevation(req, res) {
  const sessionId = req.securityContext?.deviceSessionId;

  if (!sessionId || req.securityContext?.authenticationMethod !== 'session') {
    res.status(400).json({ok: false, message: 'Une session appareil est requise.'});
    return;
  }

  req.services.getDeviceSessionService().revokeElevation(sessionId);

  const sockets = req.services.getServer().io.of('/').sockets.values();
  for (const socket of sockets) {
    if (socket.securityContext?.deviceSessionId === sessionId) {
      socket.disconnect(true);
    }
  }

  res.json({ok: true});
}
