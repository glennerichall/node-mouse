import {createRandomToken} from '../../utils/createRandomToken.js';
import {createTokenChangeListeners} from './createTokenChangeListeners.js';
import {isTokenFormatValid, normalizeToken} from './token-format.js';
import {computeTokenTtlMs} from './token-store-utils.js';

function createTokenPersistence(services) {
    return {
        countTokens: () => services.getPersistence().entryTokenDao.countEntryTokens(),
        deleteExpiredTokens: (options) => services.getPersistence().entryTokenDao.deleteExpiredEntryTokens(options),
        getLatestToken: () => services.getPersistence().entryTokenDao.getLatestEntryToken(),
        hasToken: (token) => services.getPersistence().entryTokenDao.hasEntryToken(token),
        createToken: (token, createdAt) => services.getPersistence().entryTokenDao.createEntryToken(token, createdAt),
    };
}

export function createTokenManager(services) {
    const persistence = createTokenPersistence(services);
    const tokenChangeListeners = createTokenChangeListeners();
    let initialized = false;

    function getEntryPathConfig() {
        return services.getSystemConfig().entryPath;
    }

    function getNormalizedFixedPath() {
        return normalizeToken(getEntryPathConfig().fixed);
    }

    function isEffectivelyEnabled() {
        return Boolean(getEntryPathConfig().enabled);
    }

    function isGateEnabled() {
        return isEffectivelyEnabled() || Boolean(getNormalizedFixedPath());
    }

    function isPersistenceEnabled() {
        return isEffectivelyEnabled() && !getNormalizedFixedPath();
    }

    function readCurrentToken() {
        const normalizedFixedPath = getNormalizedFixedPath();
        if (normalizedFixedPath) {
            return normalizedFixedPath;
        }
        if (!isPersistenceEnabled()) {
            return '';
        }
        const token = normalizeToken(persistence.getLatestToken?.());
        return isTokenFormatValid(token) ? token : '';
    }

    function initializeIfNeeded() {
        if (initialized) {
            return;
        }
        initialized = true;

        if (!getNormalizedFixedPath() && isEffectivelyEnabled() && !readCurrentToken()) {
            const token = createRandomToken(getEntryPathConfig().tokenLength);
            const createdAt = Date.now();
            persistence.createToken(token, createdAt);
        }
    }

    function getCurrentToken() {
        initializeIfNeeded();
        return readCurrentToken();
    }

    function loadTokens() {
        initializeIfNeeded();
        if (!isPersistenceEnabled()) {
            return 0;
        }
        return Number(persistence.countTokens?.() || 0);
    }

    function cleanupExpired({persist = false} = {}) {
        initializeIfNeeded();
        const normalizedFixedPath = getNormalizedFixedPath();
        if (!isGateEnabled() || normalizedFixedPath) {
            return;
        }
        if (persist) {
            persistence.deleteExpiredTokens({
                olderThan: Date.now() - computeTokenTtlMs(getEntryPathConfig().graceMin),
                keepToken: getCurrentToken(),
            });
        }
    }

    function createToken() {
        initializeIfNeeded();
        const normalizedFixedPath = getNormalizedFixedPath();
        const currentToken = getCurrentToken();
        if (!isEffectivelyEnabled() || normalizedFixedPath) {
            return currentToken;
        }
        const token = createRandomToken(getEntryPathConfig().tokenLength);
        const createdAt = Date.now();
        persistence.createToken(token, createdAt);
        cleanupExpired({persist: true});
        if (token !== currentToken) {
            tokenChangeListeners.notify(token);
        }
        return token;
    }

    function isValid(token) {
        initializeIfNeeded();
        const normalizedFixedPath = getNormalizedFixedPath();
        const currentToken = getCurrentToken();
        const normalized = normalizeToken(token);
        if (normalizedFixedPath) {
            if (!normalized) {
                return false;
            }
            return normalized === currentToken;
        }
        if (!isGateEnabled()) {
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
        cleanupExpired({persist: true});
        if (!isPersistenceEnabled()) {
            return false;
        }
        return Boolean(persistence.hasToken(normalized));
    }
    return {
        isValid,
        createToken,
        cleanupExpired,
        loadTokens,
        getToken: getCurrentToken,
        onTokenChanged(listener) {
            return tokenChangeListeners.subscribe(listener);
        },
    };
}
