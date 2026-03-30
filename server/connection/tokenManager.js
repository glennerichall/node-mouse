import {createRandomToken} from '../utils/createRandomToken.js';
import {
    loadEntryTokens,
    saveEntryTokens
} from '../persistence/entry-token.dao.js';

function trimSlashes(value) {
    return String(value || '').replace(/^\/+|\/+$/g, '');
}

function isTokenFormatValid(token) {
    return /^[A-Za-z0-9_-]{8,128}$/.test(String(token || ''));
}

export function createTokenManager({
                                       enabled,
                                       fixedPath,
                                       tokenLength,
                                       graceMin,
                                       persistence = {
                                           loadTokens: loadEntryTokens,
                                           saveTokens: saveEntryTokens,
                                       },
                                   }) {
    const normalizedFixedPath = trimSlashes(fixedPath);
    const effectiveEnabled = Boolean(enabled);
    const gateEnabled = effectiveEnabled || Boolean(normalizedFixedPath);
    const persistenceEnabled = effectiveEnabled && !normalizedFixedPath;
    const tokens = new Map();
    const tokenChangeListeners = new Set();

    function persistState() {
        if (!persistenceEnabled) {
            return;
        }
        persistence.saveTokens(tokens);
    }

    function resolveLatestToken() {
        let latestToken = '';
        let latestTs = -1;
        for (const [token, createdAt] of tokens.entries()) {
            if (createdAt > latestTs) {
                latestTs = createdAt;
                latestToken = token;
            }
        }
        return latestToken;
    }

    function notifyTokenChanged(nextToken) {
        for (const listener of tokenChangeListeners) {
            try {
                listener(nextToken);
            } catch (_error) {
                // Best effort: keep other listeners alive.
            }
        }
    }

    function loadTokens() {
        tokens.clear();
        if (!persistenceEnabled) {
            return 0;
        }
        const restored = persistence.loadTokens();
        if (restored instanceof Map) {
            for (const [token, createdAt] of restored.entries()) {
                const normalizedToken = trimSlashes(token);
                if (!isTokenFormatValid(normalizedToken) || !Number.isFinite(createdAt) || createdAt <= 0) {
                    continue;
                }
                tokens.set(normalizedToken, Math.floor(createdAt));
            }
        }
        return tokens.size;
    }

    if (normalizedFixedPath) {
        tokens.set(normalizedFixedPath, Date.now());
    } else if (effectiveEnabled) {
        loadTokens();
        if (!resolveLatestToken()) {
            const token = createRandomToken(tokenLength);
            tokens.set(token, Date.now());
        }
        persistState();
    }

    function cleanupExpired({persist = false} = {}) {
        if (!gateEnabled || normalizedFixedPath) {
            return;
        }
        const ttlMs = Math.max(60_000, graceMin * 60_000);
        const now = Date.now();
        const currentToken = resolveLatestToken();
        let changed = false;
        for (const [token, createdAt] of tokens.entries()) {
            if (token === currentToken) {
                continue;
            }
            if (now - createdAt > ttlMs) {
                tokens.delete(token);
                changed = true;
            }
        }
        if (changed && persist) {
            persistState();
        }
    }

    function createToken() {
        const currentToken = resolveLatestToken();
        if (!effectiveEnabled || normalizedFixedPath) {
            return currentToken;
        }
        const token = createRandomToken(tokenLength);
        tokens.set(token, Date.now());
        cleanupExpired({persist: false});
        persistState();
        if (token !== currentToken) {
            notifyTokenChanged(token);
        }
        return token;
    }

    function isValid(token) {
        const currentToken = resolveLatestToken();
        const normalized = trimSlashes(token);
        if (!gateEnabled) {
            if (!currentToken) {
                return true;
            }
            if (!normalized) {
                return false;
            }
            return normalized === currentToken;
        }
        if (!normalized) {
            return false;
        }
        cleanupExpired({persist: false});
        return tokens.has(normalized);
    }
    return {
        isValid,
        createToken,
        cleanupExpired,
        loadTokens,
        getToken: resolveLatestToken,
        onTokenChanged(listener) {
            if (typeof listener !== 'function') {
                return () => {
                };
            }
            tokenChangeListeners.add(listener);
            return () => {
                tokenChangeListeners.delete(listener);
            };
        },
    };
}
