import express from 'express';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {computeTokenTtlMs} from '../../services/token-manager/token-store-utils.js';
import {publicDir, projectRoot} from '../../utils/paths.js';
import {getRecentLogs} from '../../services/log/logger.js';
import {readPackageVersion} from '../../utils/env.js';

const packageJsonPath = path.join(projectRoot, 'package.json');

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

function maskToken(token) {
  const normalized = String(token || '').trim();
  if (!normalized) {
    return '[masque]';
  }

  const fingerprint = createHash('sha256')
    .update(normalized)
    .digest('hex')
    .slice(0, 8);

  return `[masque:${fingerprint}]`;
}

function buildTokenEntries({entries, currentToken, entryPathConfig}) {
  const entryPath = entryPathConfig || {};
  const graceTtlMs = computeTokenTtlMs(entryPath.graceMin);
  const rotateTtlMs = Math.max(60_000, Number(entryPath.rotateMin || 0) * 60_000);
  const normalizedCurrentToken = String(currentToken || '').trim();
  let currentTokenCreatedAt = null;
  const tokenEntries = Array.from(entries || [], ([token, createdAt]) => {
    if (token === normalizedCurrentToken) {
      currentTokenCreatedAt = createdAt;
      return null;
    }

    const createdAtMs = Math.floor(Number(createdAt));

    return {
      token: maskToken(token),
      isCurrent: false,
      createdAt: Number.isFinite(createdAtMs) ? new Date(createdAtMs).toISOString() : null,
      expiresAt: Number.isFinite(createdAtMs) ? new Date(createdAtMs + graceTtlMs).toISOString() : null,
    };
  }).filter(Boolean);

  if (!normalizedCurrentToken) {
    return tokenEntries;
  }

  const currentTokenCreatedAtMs = Math.floor(Number(currentTokenCreatedAt));
  const currentTokenExpiresAtMs = Number.isFinite(currentTokenCreatedAtMs)
    ? currentTokenCreatedAtMs + Math.max(graceTtlMs, rotateTtlMs)
    : NaN;

  tokenEntries.push({
    token: maskToken(normalizedCurrentToken),
    isCurrent: true,
    createdAt: Number.isFinite(currentTokenCreatedAtMs) ? new Date(currentTokenCreatedAtMs).toISOString() : null,
    expiresAt: Number.isFinite(currentTokenExpiresAtMs) ? new Date(currentTokenExpiresAtMs).toISOString() : null,
  });

  return tokenEntries;
}

export function createServerInfoRouter(services) {
  const router = express.Router();

  router.get('/', (_req, res) => {
    res.sendFile(path.join(publicDir, 'server-info.html'));
  });

  router.get('/data', (_req, res) => {
    const clients = getConnectedClients(services.getServer().io);
    const rawConfig = services.getConfig();
    const rawSystemConfig = services.getSystemConfig?.() || {};
    const config = redactSecrets(rawConfig);
    const sysConfig = redactSecrets(rawSystemConfig);
    const logs = getRecentLogs(250);
    const version = readPackageVersion(packageJsonPath);
    const tasks = services.getTaskManager().getTasksSnapshot();
    const tokenEntries = services.getPersistence().entryTokenDao.loadEntryTokens();
    const currentToken = services.getTokenManager().getToken();
    const entryPathConfig = services.getSystemConfig().entryPath;
    const tokens = buildTokenEntries({
      entries: tokenEntries,
      currentToken,
      entryPathConfig,
    });

    res.json({
      version,
      now: new Date().toISOString(),
      onlineSince: new Date(services.getServer().serverStartedAt).toISOString(),
      uptimeSec: Math.floor(process.uptime()),
      clientsConnected: clients.length,
      clients,
      tasks,
      tokens,
      config,
      sysConfig,
      logs,
    });
  });
  return router;
}

export const __testables = {
  buildTokenEntries,
  redactSecrets,
};
