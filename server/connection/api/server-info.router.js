import express from 'express';
import path from 'node:path';

function redactSecrets(value, key = '') {
  const keyLower = String(key || '').toLowerCase();
  if (keyLower.includes('secret') || keyLower.includes('password')) {
    return '[redacted]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item));
  }

  if (value && typeof value === 'object') {
    const out = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      out[childKey] = redactSecrets(childValue, childKey);
    }
    return out;
  }

  return value;
}

function getConnectedClients(io) {
  return Array.from(io.of('/').sockets.values()).map((socket) => ({
    id: socket.id,
    connectedAt: Number.isFinite(socket?.handshake?.issued)
      ? new Date(socket.handshake.issued).toISOString()
      : null,
    address: socket?.handshake?.address || socket?.conn?.remoteAddress || null,
    transport: socket?.conn?.transport?.name || 'unknown',
  }));
}

export function createServerInfoRouter({
  publicDir,
  io,
  serverStartedAt,
  getConfigSnapshot,
  getRecentLogs,
  getVersion,
}) {
  const router = express.Router();

  router.get('/', (_req, res) => {
    res.sendFile(path.join(publicDir, 'server-info.html'));
  });

  router.get('/data', (_req, res) => {
    const clients = getConnectedClients(io);
    const rawConfig = typeof getConfigSnapshot === 'function' ? getConfigSnapshot() : {};
    const config = redactSecrets(rawConfig);
    const logs = typeof getRecentLogs === 'function' ? getRecentLogs(250) : [];
    const version = typeof getVersion === 'function' ? getVersion() : 'unknown';

    res.json({
      version,
      now: new Date().toISOString(),
      onlineSince: new Date(serverStartedAt).toISOString(),
      uptimeSec: Math.floor(process.uptime()),
      clientsConnected: clients.length,
      clients,
      config,
      logs,
    });
  });

  return router;
}
