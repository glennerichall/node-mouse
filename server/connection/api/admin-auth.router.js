import {createHash, timingSafeEqual} from 'node:crypto';
import express from 'express';
import {createRateLimitMiddleware} from '../security/createRateLimiter.js';

function passwordMatches(actual, expected) {
  const actualHash = createHash('sha256').update(String(actual || '')).digest();
  const expectedHash = createHash('sha256').update(String(expected || '')).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export function unlockAdmin(req, res) {
  const config = req.services.getSystemConfig();
  const expected = String(config.admin?.password || '');
  const password = String(req.body?.password || '');
  const sessionId = req.securityContext?.deviceSessionId;

  if (!sessionId || req.securityContext?.authenticationMethod !== 'session') {
    res.status(400).json({ok: false, message: 'Une session appareil est requise.'});
    return;
  }
  if (expected.length < 12) {
    res.status(503).json({ok: false, message: 'Le déverrouillage administrateur n’est pas configuré.'});
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

export const adminAuthRouter = express.Router()
  .use(createRateLimitMiddleware({
    limit: 5,
    windowMs: 5 * 60_000,
    methods: ['POST'],
    keyGenerator: (req) => req.securityContext?.deviceSessionId,
  }))
  .post('/unlock', unlockAdmin);
