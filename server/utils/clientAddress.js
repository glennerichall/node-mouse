import proxyaddr from 'proxy-addr';

const NEVER_TRUST = () => false;
const trustCache = new Map();

export function createProxyTrust(value) {
    const entries = String(value || '')
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);

    if (entries.length === 0) {
        return NEVER_TRUST;
    }

    const key = entries.join(',');
    if (!trustCache.has(key)) {
        trustCache.set(key, proxyaddr.compile(entries));
    }
    return trustCache.get(key);
}

export function resolveClientAddress(request, trustProxy = '') {
    if (!request?.socket?.remoteAddress) {
        return '';
    }
    const trust = createProxyTrust(trustProxy);
    if (trust === NEVER_TRUST) {
        return request.socket.remoteAddress;
    }
    return proxyaddr({
        headers: request.headers || {},
        socket: request.socket,
    }, trust);
}

export function isLocalAddress(value) {
    const address = String(value || '').toLowerCase();
    return address === '127.0.0.1'
        || address === '::1'
        || address === '::ffff:127.0.0.1';
}
