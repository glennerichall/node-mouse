import os from 'node:os';

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
    console.warn('Impossible de détecter l\'IP LAN automatiquement, fallback sur localhost.');
  }

  return '127.0.0.1';
}

export function getPublicUrl(port, protocol = 'http', forcedHost = '') {
  return `${protocol}://${getLanIp(forcedHost)}:${port}`;
}
