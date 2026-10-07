import {createHash} from 'node:crypto';
import path from 'node:path';
import {computeTokenTtlMs} from '../../services/token-manager/token-store-utils.js';
import {projectRoot} from '../../utils/paths.js';
import {getRecentLogs} from '../../application/logger.js';
import {readPackageVersion} from '../../utils/env.js';

const packageJsonPath = path.join(projectRoot, 'package.json');

export function redactSecrets(value, key = '') {
  const keyLower = String(key || '').toLowerCase();
  if (keyLower.includes('secret') || keyLower.includes('password')) return '[redacted]';
  if (Array.isArray(value)) return value.map((item) => redactSecrets(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [
      childKey, redactSecrets(childValue, childKey),
    ]));
  }
  return value;
}

export function buildConfigSnapshots(rawConfig, rawSystemConfig) {
  return {config: redactSecrets(rawConfig), sysConfig: redactSecrets(rawSystemConfig)};
}

export function getConnectedClients(io) {
  return Array.from(io.of('/').sockets.values()).map((socket) => ({
    id: socket.id,
    connectedAt: Number.isFinite(socket?.handshake?.issued)
      ? new Date(socket.handshake.issued).toISOString() : null,
    address: socket?.handshake?.address || socket?.conn?.remoteAddress || null,
    transport: socket?.conn?.transport?.name || 'unknown',
  }));
}

export function maskToken(token) {
  const normalized = String(token || '').trim();
  if (!normalized) return '[masque]';
  return `[masque:${createHash('sha256').update(normalized).digest('hex').slice(0, 8)}]`;
}

export function buildTokenEntries({entries, currentToken, entryPathConfig}) {
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
      token: maskToken(token), isCurrent: false,
      createdAt: Number.isFinite(createdAtMs) ? new Date(createdAtMs).toISOString() : null,
      expiresAt: Number.isFinite(createdAtMs) ? new Date(createdAtMs + graceTtlMs).toISOString() : null,
    };
  }).filter(Boolean);
  if (!normalizedCurrentToken) return tokenEntries;
  const currentTokenCreatedAtMs = Math.floor(Number(currentTokenCreatedAt));
  const currentTokenExpiresAtMs = Number.isFinite(currentTokenCreatedAtMs)
    ? currentTokenCreatedAtMs + Math.max(graceTtlMs, rotateTtlMs) : NaN;
  tokenEntries.push({
    token: maskToken(normalizedCurrentToken), isCurrent: true,
    createdAt: Number.isFinite(currentTokenCreatedAtMs) ? new Date(currentTokenCreatedAtMs).toISOString() : null,
    expiresAt: Number.isFinite(currentTokenExpiresAtMs) ? new Date(currentTokenExpiresAtMs).toISOString() : null,
  });
  return tokenEntries;
}

export function getServerInfoPage(_req, res) {
  res.sendFile(path.join(projectRoot, 'public', 'server-info.html'));
}

export async function getServerInfoData(req, res) {
  const {services} = req;
  const clients = getConnectedClients(services.getServer().io);
  const rawConfig = services.getConfig();
  const rawSystemConfig = services.getSystemConfig();
  const {config, sysConfig} = buildConfigSnapshots(rawConfig, rawSystemConfig);
  const recentLogWindow = getRecentLogs(251);
  const logs = recentLogWindow.slice(-250);
  const version = readPackageVersion(packageJsonPath);
  const tasks = services.getTaskManager().getTasksSnapshot();
  const tokenEntries = services.getPersistence().entryTokenDao.loadEntryTokens();
  const restarts = services.getPersistence().restartLogDao.listRecentRestartRecords(20);
  const updateEvents = services.getPersistence().updateEventLogDao.listRecentEvents(20);
  const currentToken = services.getTokenManager().getToken();
  const daemon = await services.getApplicationDaemonService().getInfo();
  const system = await services.getSystem().getInfo();
  const tokens = buildTokenEntries({entries: tokenEntries, currentToken, entryPathConfig: rawSystemConfig.entryPath});

  res.json({
    version, now: new Date().toISOString(),
    onlineSince: new Date(services.getServer().serverStartedAt).toISOString(),
    uptimeSec: Math.floor(process.uptime()), clientsConnected: clients.length, clients,
    tasks, tokens, daemon, system, restarts, updateEvents, config, sysConfig, logs,
    logsTruncated: recentLogWindow.length > logs.length,
  });
}
