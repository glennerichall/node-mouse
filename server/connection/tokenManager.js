import fs from 'node:fs';
import path from 'node:path';
import {createRandomToken} from '../../utils/server/createRandomToken.js';

function trimSlashes(value) {
    return String(value || '').replace(/^\/+|\/+$/g, '');
}

function isTokenFormatValid(token) {
    return /^[A-Za-z0-9_-]{8,128}$/.test(String(token || ''));
}

function ensureDirForFile(filePath) {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, {recursive: true});
}

function parseState(raw) {
    try {
        const payload = JSON.parse(raw);
        if (!payload || typeof payload !== 'object') {
            return null;
        }

        const tokens = new Map();
        const entries = Array.isArray(payload.tokens) ? payload.tokens : [];
        for (const entry of entries) {
            if (!Array.isArray(entry) || entry.length !== 2) {
                continue;
            }
            const token = trimSlashes(entry[0] || '');
            const createdAt = Number(entry[1]);
            if (!isTokenFormatValid(token) || !Number.isFinite(createdAt) || createdAt <= 0) {
                continue;
            }
            tokens.set(token, Math.floor(createdAt));
        }

        return {tokens};
    } catch (_error) {
        return null;
    }
}

function loadPersistedState(stateFilePath) {
    if (!stateFilePath || !fs.existsSync(stateFilePath)) {
        return null;
    }
    try {
        const raw = fs.readFileSync(stateFilePath, 'utf8');
        return parseState(raw);
    } catch (_error) {
        return null;
    }
}

function savePersistedState(stateFilePath, {tokens}) {
    if (!stateFilePath) {
        return;
    }

    try {
        ensureDirForFile(stateFilePath);
        const payload = {
            version: 1,
            updatedAt: Date.now(),
            tokens: Array.from(tokens.entries()),
        };
        fs.writeFileSync(stateFilePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    } catch (error) {
        console.warn(`Token state save failed: ${error.message}`);
    }
}

export function createTokenManager({
                                       enabled,
                                       fixedPath,
                                       tokenLength,
                                       graceMin,
                                       stateFilePath,
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
        savePersistedState(stateFilePath, {tokens});
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
        const restored = loadPersistedState(stateFilePath);
        if (restored) {
            for (const [token, createdAt] of restored.tokens.entries()) {
                tokens.set(token, createdAt);
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
    
    loadTokens();

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
