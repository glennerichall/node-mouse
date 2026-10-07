import express from 'express';

export function listDeviceSessions(req, res) {
  const service = req.services.getDeviceSessionService();
  res.json({
    ok: true,
    sessions: service.listSessions(),
    history: service.listHistory(),
  });
}

export function revokeDeviceSession(req, res) {
  const revoked = req.services.getDeviceSessionService().revokeSession(req.params.sessionId);
  if (!revoked) {
    res.status(404).json({ok: false, message: 'Session d’appareil introuvable ou déjà révoquée.'});
    return;
  }
  res.status(204).end();
}

export function revokeAllDeviceSessions(req, res) {
  const revokedCount = req.services.getDeviceSessionService().revokeAllSessions();
  res.json({ok: true, revokedCount});
}

export const adminSessionsRouter = express.Router()
  .get('/', listDeviceSessions)
  .delete('/', revokeAllDeviceSessions)
  .delete('/:sessionId', revokeDeviceSession);
