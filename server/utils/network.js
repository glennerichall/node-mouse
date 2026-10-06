import os from 'node:os';
import { createSocket } from 'node:dgram';
import { createConnection } from 'node:net';
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

export function normalizeBaseUrl(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  let parsed;
  try {
    parsed = new URL(normalized);
  } catch (_error) {
    throw new Error('PUBLIC_BASE_URL must be an absolute HTTP(S) URL');
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('PUBLIC_BASE_URL must be an absolute HTTP(S) URL without credentials or query parameters');
  }
  return parsed.toString().replace(/\/$/, '');
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

export function isTcpPortOpen(host, port, timeoutMs = 1500) {
  const normalizedHost = String(host || '').trim();
  const normalizedPort = Number(port);
  if (!normalizedHost || !Number.isInteger(normalizedPort) || normalizedPort < 1 || normalizedPort > 65535) {
    return Promise.resolve(false);
  }

  return new Promise((resolve) => {
    const socket = createConnection({host: normalizedHost, port: normalizedPort});
    let settled = false;
    const finish = (isOpen) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(isOpen);
    };

    socket.setTimeout(Math.max(250, Number(timeoutMs) || 1500));
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

export function wakeHost(mac, {
  address = '255.255.255.255',
  port = 9,
  packetCount = 30,
  intervalMs = 100,
} = {}) {
  const normalizedMac = String(mac || '').replace(/[^a-f0-9]/gi, '');
  if (!/^[a-f0-9]{12}$/i.test(normalizedMac) || /^0{12}$/.test(normalizedMac)) {
    return Promise.reject(new Error('TV mac address is required'));
  }

  const macBuffer = Buffer.from(normalizedMac, 'hex');
  const packet = Buffer.alloc(6 + (16 * macBuffer.length), 0xff);
  for (let offset = 6; offset < packet.length; offset += macBuffer.length) {
    macBuffer.copy(packet, offset);
  }

  return new Promise((resolve, reject) => {
    const socket = createSocket('udp4');
    const totalPackets = Math.max(1, Number(packetCount) || 30);
    const delayMs = Math.max(0, Number(intervalMs) || 0);
    let sentPackets = 0;
    let timer = null;
    let settled = false;

    const finish = (error) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timer) {
        clearTimeout(timer);
      }
      try {
        socket.close();
      } catch (_error) {}
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    };

    const sendNext = () => {
      socket.send(packet, Number(port) || 9, address, (error) => {
        if (error) {
          finish(error);
          return;
        }
        sentPackets += 1;
        if (sentPackets >= totalPackets) {
          finish();
          return;
        }
        timer = setTimeout(sendNext, delayMs);
      });
    };

    socket.once('error', finish);
    socket.bind(() => {
      try {
        socket.setBroadcast(true);
        sendNext();
      } catch (error) {
        finish(error);
      }
    });
  });
}
