import {
    readOptionalBoolean,
    readOptionalNumber,
    readOptionalString
} from "../../utils/env.js";
import {compactObject} from "../../../utils/shared/objet.utils.js";

export function getEnvConfig() {
    return {
        port: readOptionalNumber('PORT'),
        serverHost: readOptionalString('SERVER_HOST'),
        entryPath: {
            enabled: readOptionalBoolean('ENTRY_PATH_ENABLED'),
            fixed: readOptionalString('ENTRY_PATH_FIXED'),
            tokenLength: readOptionalNumber('ENTRY_PATH_TOKEN_LENGTH'),
            rotateMin: readOptionalNumber('ENTRY_PATH_ROTATE_INTERVAL_MIN'),
            graceMin: readOptionalNumber('ENTRY_PATH_GRACE_MIN'),
        },
        session: {
            cookieName: readOptionalString('SESSION_COOKIE_NAME'),
            cookieSecret: readOptionalString('SESSION_COOKIE_SECRET'),
            cookieMaxAgeDays: readOptionalNumber('SESSION_COOKIE_MAX_AGE_DAYS'),
            socketEventMaxAgeMs: readOptionalNumber('SOCKET_EVENT_MAX_AGE_MS'),
        },
        adminActionsEnabled: readOptionalBoolean('ADMIN_ACTIONS_ENABLED'),
        serviceName: readOptionalString('SERVICE_NAME'),
        https: {
            enabled: readOptionalBoolean('HTTPS'),
            sslKeyPath: readOptionalString('SSL_KEY_PATH'),
            sslCertPath: readOptionalString('SSL_CERT_PATH'),
        },
        updateCheck: {
            checkCommand: readOptionalString('UPDATE_CHECK_COMMAND'),
            checkTimeoutSec: readOptionalNumber('UPDATE_CHECK_TIMEOUT_SEC'),
            intervalMin: readOptionalNumber('UPDATE_CHECK_INTERVAL_MIN'),
            packageName: readOptionalString('UPDATE_CHECK_PACKAGE'),
            currentVersion: readOptionalString('UPDATE_CHECK_CURRENT_VERSION'),
            installCommand: readOptionalString('UPDATE_INSTALL_COMMAND'),
            installTimeoutSec: readOptionalNumber('UPDATE_INSTALL_TIMEOUT_SEC'),
        },
        persistence: {
            dbPath: readOptionalString('PERSISTENCE_DB_PATH'),
        }
    };
}
