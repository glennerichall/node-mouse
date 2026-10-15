function actionResult(result, fallback) {
  return {
    ok: Boolean(result?.ok),
    message: String(result?.message || fallback),
    ...(result?.data === undefined ? {} : {data: result.data}),
  };
}

function disconnectSessions(services, sessionIds) {
  const sockets = services.getServer().io.of('/').sockets.values();
  const ids = new Set(sessionIds);
  for (const socket of sockets) {
    if (ids.has(socket.securityContext?.deviceSessionId)) {
      socket.disconnect(true);
    }
  }
}

function executeSecurityCommand(services, args = {}) {
  const sessionService = services.getDeviceSessionService();
  const action = String(args.action || 'list').trim();

  if (action === 'list') {
    return {
      ok: true,
      message: 'Sessions de securite.',
      data: {
        sessions: sessionService.listSessions(),
        history: sessionService.listHistory(),
      },
    };
  }

  if (action === 'revoke') {
    const sessionId = String(args.sessionId || '').trim();
    if (!sessionId) {
      return {ok: false, message: 'Identifiant de session manquant.'};
    }
    if (!sessionService.revokeSession(sessionId)) {
      return {ok: false, message: 'Session d appareil introuvable ou deja revoquee.'};
    }
    disconnectSessions(services, [sessionId]);
    return {ok: true, message: `Session ${sessionId} revoquee.`};
  }

  if (action === 'revoke-all') {
    const sessionIds = sessionService.listSessions()
      .filter((session) => session.state !== 'revoked')
      .map((session) => session.id);
    const revokedCount = sessionService.revokeAllSessions();
    disconnectSessions(services, sessionIds);
    return {ok: true, message: `${revokedCount} session(s) revoquee(s).`, data: {revokedCount}};
  }

  return {ok: false, message: `Action security inconnue: ${action}`};
}

export async function executeAdminCommand(services, args = {}) {
  const action = String(args.action || '').trim();

  if (action === 'update-check') {
    return actionResult(
      await services.getRemotes().adminActions.forceUpdateCheck(),
      'Verification de mise a jour terminee.',
    );
  }

  if (action === 'update') {
    return actionResult(
      await services.getRemotes().adminActions.installUpdate(),
      'Installation de la mise a jour terminee.',
    );
  }

  if (action === 'rotate-token') {
    return actionResult(
      await services.getRemotes().qrActions.rotateEntryToken(),
      'Rotation du token d entree terminee.',
    );
  }

  if (action === 'security' || action === 'list' || action === 'revoke' || action === 'revoke-all') {
    return executeSecurityCommand(services, action === 'security' ? args : {...args, action});
  }

  return {ok: false, message: `Commande admin inconnue: ${action || '(vide)'}`};
}
