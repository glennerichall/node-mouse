import {createRandomToken} from '../../utils/createRandomToken.js';
import {createTokenChangeListeners} from './createTokenChangeListeners.js';
import {isTokenFormatValid, normalizeToken} from './token-format.js';
import {computeTokenTtlMs} from './token-store-utils.js';

function createTokenPersistence(services) {
    return {
        countTokens: () => services.getPersistence().entryTokenDao.countEntryTokens(),
        deleteExpiredTokens: (options) => services.getPersistence().entryTokenDao.deleteExpiredEntryTokens(options),
        getLatestToken: () => services.getPersistence().entryTokenDao.getLatestEntryToken(),
        getLatestTokenRecord: () => services.getPersistence().entryTokenDao.getLatestEntryTokenRecord(),
        hasToken: (token) => services.getPersistence().entryTokenDao.hasEntryToken(token),
        createToken: (token, createdAt) => services.getPersistence().entryTokenDao.createEntryToken(token, createdAt),
    };
}

export function createTokenManager(services) {
    const persistence = createTokenPersistence(services);
    const tokenChangeListeners = createTokenChangeListeners();

    function publishState(type = 'state.changed') {
        if (typeof services.getPubSub !== 'function') {
            return;
        }

        services.getPubSub().publish('token-manager', {
            enabled: isEffectivelyEnabled(),
            gateEnabled: isGateEnabled(),
            persistenceEnabled: isPersistenceEnabled(),
            token: getCurrentToken() || '',
            tokenCount: loadTokens(),
            nextRotationDelayMs: getNextRotationDelayMs(),
        }, {type});
    }

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

    function getCurrentToken() {
        return readCurrentToken();
    }

    function getRotateTtlMs() {
        return Math.max(60_000, Number(getEntryPathConfig().rotateMin || 0) * 60_000);
    }

    function getLatestTokenRecord() {
        const record = persistence.getLatestTokenRecord?.();
        const token = normalizeToken(record?.token);
        const createdAt = Math.floor(Number(record?.createdAt));

        if (!isTokenFormatValid(token) || !Number.isFinite(createdAt)) {
            return null;
        }

        return {
            token,
            createdAt,
        };
    }

    function loadTokens() {
        if (!isPersistenceEnabled()) {
            return 0;
        }
        return Number(persistence.countTokens?.() || 0);
    }

    function cleanupExpired({persist = false} = {}) {
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
        const normalizedFixedPath = getNormalizedFixedPath();
        const currentToken = getCurrentToken();
        if (!isEffectivelyEnabled() || normalizedFixedPath) {
            return currentToken;
        }
        const createdAt = Date.now();
        const token = createRandomToken(getEntryPathConfig().tokenLength);

        if (currentToken && currentToken !== token) {
            // Keep the previous token valid for a fresh grace window after rotation,
            // while ensuring the newly generated token remains the current one.
            persistence.createToken(currentToken, createdAt - 1);
        }

        persistence.createToken(token, createdAt);
        cleanupExpired({persist: true});
        if (token !== currentToken) {
            publishState('token.changed');
            tokenChangeListeners.notify(token);
        }
        return token;
    }

    function isValid(token) {
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

    function getNextRotationDelayMs() {
        if (!isPersistenceEnabled()) {
            return null;
        }

        const latestToken = getLatestTokenRecord();
        if (!latestToken) {
            return 0;
        }

        return Math.max(0, latestToken.createdAt + getRotateTtlMs() - Date.now());
    }

    function rotateIfNeeded() {
        if (!isPersistenceEnabled()) {
            return getCurrentToken();
        }

        const latestToken = getLatestTokenRecord();
        if (!latestToken) {
            return createToken();
        }

        if (Date.now() < latestToken.createdAt + getRotateTtlMs()) {
            return latestToken.token;
        }

        return createToken();
    }
    
    return {
        isValid,
        createToken,
        cleanupExpired,
        loadTokens,
        getToken: getCurrentToken,
        getNextRotationDelayMs,
        rotateIfNeeded,
        publishState,
        onTokenChanged(listener) {
            return tokenChangeListeners.subscribe(listener);
        },
    };
}
