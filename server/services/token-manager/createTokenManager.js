import {createRandomToken} from '../../utils/createRandomToken.js';
import {isTokenFormatValid, normalizeToken} from './token-format.js';
import {computeTokenTtlMs} from './token-store-utils.js';
import {
    PUBSUB_EVENT_STATE_CHANGED,
    PUBSUB_EVENT_TOKEN_CHANGED,
    PUBSUB_SERVICE_TOKEN_MANAGER
} from "../pubsub/serviceEventConstants.js";
import {createLogger} from '../../application/logger.js';

let log;
function getModuleLog() {
    log ??= createLogger('token-manager');
    return log;
}

function createTokenPersistence(services) {
    return {
        countTokens: () => services.getPersistence().entryTokenDao.countEntryTokens(),
        deleteExpiredTokens: (options) => services.getPersistence().entryTokenDao.deleteExpiredEntryTokens(options),
        getLatestToken: () => services.getPersistence().entryTokenDao.getLatestEntryToken(),
        getLatestTokenRecord: () => services.getPersistence().entryTokenDao.getLatestEntryTokenRecord?.(),
        hasToken: (token) => services.getPersistence().entryTokenDao.hasEntryToken(token),
        createToken: (token, createdAt) => services.getPersistence().entryTokenDao.createEntryToken(token, createdAt),
    };
}

export function createTokenManager(services) {
    const log = getModuleLog();
    const persistence = createTokenPersistence(services);

    function publishState(type = PUBSUB_EVENT_STATE_CHANGED) {
        const latestToken = getLatestTokenRecord();
        const nextRotationDelayMs = !isPersistenceEnabled()
            ? null
            : !latestToken
                ? 0
                : Math.max(0, latestToken.createdAt + getRotateTtlMs() - Date.now());

        log.trace({
            type,
            enabled: isEffectivelyEnabled(),
            gateEnabled: isGateEnabled(),
            persistenceEnabled: isPersistenceEnabled(),
            hasCurrentToken: Boolean(getCurrentToken()),
            tokenCount: loadTokens(),
            nextRotationDelayMs,
        }, 'Token manager state published');

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
        const record = persistence.getLatestTokenRecord?.() || (() => {
            const token = normalizeToken(persistence.getLatestToken?.());
            return token ? {token, createdAt: Number.NaN} : null;
        })();
        const token = normalizeToken(record?.token);
        const createdAt = Math.floor(Number(record?.createdAt));

        if (!isTokenFormatValid(token)) {
            return null;
        }

        if (!Number.isFinite(createdAt)) {
            return {token, createdAt: Number.NaN};
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
            log.trace({
                persist,
                gateEnabled: isGateEnabled(),
                fixedPathEnabled: Boolean(normalizedFixedPath),
            }, 'Expired token cleanup skipped');
            return;
        }
        if (persist) {
            const graceTtlMs = computeTokenTtlMs(getEntryPathConfig().graceMin);
        log.debug({graceTtlMs}, 'Expired token cleanup');
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
            log.trace({
                enabled: isEffectivelyEnabled(),
                fixedPathEnabled: Boolean(normalizedFixedPath),
                hasCurrentToken: Boolean(currentToken),
            }, 'Token creation skipped');
            return currentToken;
        }
        const createdAt = Date.now();
        const token = createRandomToken(getEntryPathConfig().tokenLength);

        log.debug({tokenLength: token.length}, 'Created new entry token');
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
            log.trace({
                mode: 'fixed',
                hasInputToken: Boolean(normalized),
            }, 'Entry token validated');
            if (!normalized) {
                return false;
            }
            return normalized === currentToken;
        }
        if (!isGateEnabled()) {
            log.trace({
                mode: 'disabled',
                hasCurrentToken: Boolean(currentToken),
                hasInputToken: Boolean(normalized),
            }, 'Entry token validated');
            if (!currentToken) {
                return true;
            }
            if (!normalized) {
                return false;
            }
            return normalized === currentToken;
        }
        if (!normalized) {
        log.trace('Entry token validation rejected: empty token');
            return false;
        }
        cleanupExpired({persist: true});
        if (!isPersistenceEnabled()) {
        log.trace('Entry token validation rejected: persistence inactive');
            return false;
        }
        log.trace('Entry token validation through persistence');
        return Boolean(persistence.hasToken(normalized));
    }

    function rotateIfNeeded() {
        if (!isPersistenceEnabled()) {
        log.trace('Token rotation skipped: persistence inactive');
            return getCurrentToken();
        }

        const latestToken = getLatestTokenRecord();
        if (!latestToken) {
        log.debug('Token rotation: no existing token');
            return createToken();
        }

        if (!Number.isFinite(latestToken.createdAt) || Date.now() < latestToken.createdAt + getRotateTtlMs()) {
            log.trace({
                hasCreatedAt: Number.isFinite(latestToken.createdAt),
            }, 'Token rotation not required');
            return latestToken.token;
        }

        log.debug('Token rotation required');
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
