import {createRandomToken} from '../../utils/createRandomToken.js';
import {isTokenFormatValid, normalizeToken} from './token-format.js';
import {computeTokenTtlMs} from './token-store-utils.js';
import {
    PUBSUB_EVENT_TOKEN_CHANGED,
    PUBSUB_SERVICE_TOKEN_MANAGER
} from "../pubsub/serviceEventConstants.js";

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

    function publishState(type = 'state.changed') {
        if (typeof services.getEvents !== 'function') {
            return;
        }

        const latestToken = getLatestTokenRecord();
        const nextRotationDelayMs = !isPersistenceEnabled()
            ? null
            : !latestToken
                ? 0
                : Math.max(0, latestToken.createdAt + getRotateTtlMs() - Date.now());

        services.getEvents().publishState(PUBSUB_SERVICE_TOKEN_MANAGER, {
            enabled: isEffectivelyEnabled(),
            gateEnabled: isGateEnabled(),
            persistenceEnabled: isPersistenceEnabled(),
            token: getCurrentToken() || '',
            tokenCount: loadTokens(),
            nextRotationDelayMs,
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
            const graceTtlMs = computeTokenTtlMs(getEntryPathConfig().graceMin);
            persistence.deleteExpiredTokens({
                olderThan: Date.now() - graceTtlMs,
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

        persistence.createToken(token, createdAt);
        cleanupExpired({persist: true});
        if (token !== currentToken) {
            publishState(PUBSUB_EVENT_TOKEN_CHANGED);
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
        rotateIfNeeded,
    };
}
