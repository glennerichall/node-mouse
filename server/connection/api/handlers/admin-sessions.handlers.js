export function listDeviceSessions(req, res) {
  const service = req.services.getDeviceSessionService();
  const currentSessionId = req.securityContext?.deviceSessionId;
  res.json({
    ok: true,
    sessions: service.listSessions().map((session) => ({
      ...session,
      isCurrent: session.id === currentSessionId,
    })),
    history: service.listHistory(),
  });
}

export function revokeDeviceSession(req, res) {
  const {services} = req;
  const sessionId = String(req.params.sessionId || '');
  const revoked = services.getDeviceSessionService().revokeSession(sessionId);
  if (!revoked) {
    res.status(404).json({ok: false, message: 'Session d’appareil introuvable ou déjà révoquée.'});
    return;
  }

  const sockets = services.getServer().io.of('/').sockets.values();
  for (const socket of sockets) {
    if (socket.securityContext?.deviceSessionId === sessionId) {
      socket.disconnect(true);
    }
  }

  res.status(204).end();
}

export function revokeAllDeviceSessions(req, res) {
  const {services, securityContext} = req;
  const sessionService = services.getDeviceSessionService();
  const currentSessionId = securityContext?.deviceSessionId || '';
  const revokedSessionIds = new Set(sessionService.listSessions()
    .filter((session) => session.id !== currentSessionId && session.state !== 'revoked')
    .map((session) => session.id));
  const revokedCount = sessionService.revokeAllSessions({exceptId: currentSessionId});

  const sockets = services.getServer().io.of('/').sockets.values();
  for (const socket of sockets) {
    const sessionId = socket.securityContext?.deviceSessionId;
    if (sessionId && revokedSessionIds.has(sessionId) && sessionId !== currentSessionId) {
      socket.disconnect(true);
    }
  }

  res.json({ok: true, revokedCount});
}
