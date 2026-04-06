import os from 'node:os';
import { execFileAsync } from './process.js';

export function getLanIp(forcedHost = '') {
  if (forcedHost) {
    return forcedHost;
  }

  try {
    const interfaces = os.networkInterfaces();
    for (const interfaceName of Object.keys(interfaces)) {
      const addresses = interfaces[interfaceName] || [];
      for (const address of addresses) {
        if (address.family === 'IPv4' && !address.internal) {
          return address.address;
        }
      }
    }
  } catch (_error) {
    console.warn("Impossible de detecter l'IP LAN automatiquement, fallback sur localhost.");
  }

  return '127.0.0.1';
}

export function getPublicUrl(port, protocol = 'http', forcedHost = '') {
  return `${protocol}://${getLanIp(forcedHost)}:${port}`;
}

export async function pingHost(host, timeoutMs = 2000) {
  const normalizedHost = String(host || '').trim();
  if (!normalizedHost) {
    return false;
  }

  const args = process.platform === 'win32'
    ? ['-n', '1', normalizedHost]
    : ['-c', '1', normalizedHost];

  const result = await execFileAsync('ping', args, {
    timeout: Math.max(250, Number(timeoutMs) || 2000),
  });

  return Boolean(result.ok);
}
