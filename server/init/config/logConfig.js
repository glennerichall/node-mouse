import {getConfig} from "./index.js";

function emitConfigLine(logger, message, fields = {}) {
    if (logger && typeof logger.info === 'function') {
        logger.info(fields, message);
        return;
    }
    console.log(`${message} ${JSON.stringify(fields)}`);
}

export function logStartupConfig(logger) {
    const payload = getConfig();
    emitConfigLine(logger, 'Configuration');
    emitConfigLine(logger, 'config.network', {
        protocol: payload.protocol,
        port: payload.port,
        serverHost: payload.serverHost || '(auto LAN detection)',
    });
    emitConfigLine(logger, 'config.entryPath', {
        ...payload.entryPath,
        fixed: payload.entryPath.fixed || '(random)',
    });
    emitConfigLine(logger, 'config.session', {
        ...payload.session,
        cookieSecret: undefined,
    });
    emitConfigLine(logger, 'config.input', payload.input);
    emitConfigLine(logger, 'config.preview', payload.preview);
    emitConfigLine(logger, 'config.notifications', payload.notifications);
    emitConfigLine(logger, 'config.admin', {
        adminActionsEnabled: payload.adminActionsEnabled,
        serviceName: payload.serviceName,
    });
    emitConfigLine(logger, 'config.samsungTv', {
        ...payload.samsungTv,
        mac: payload.samsungTv.mac ? '(set)' : '(unset)',
    });
    emitConfigLine(logger, 'config.update', {
        ...payload.updateCheck,
        packageName: payload.updateCheck.packageName || '(none)',
        currentVersion: payload.updateCheck.currentVersion || '(none)',
        installCommand: payload.updateCheck.installCommand || '(unset)',
    });
    emitConfigLine(logger, 'config.qrOverlay', payload.qrOverlay);
    emitConfigLine(logger, 'config.runtime', {
        graphicalDisplay: payload.graphicalDisplay,
        https: {
            ...payload.https,
            sslKeyPath: payload.https.enabled ? (payload.https.sslKeyPath || '(missing)') : undefined,
            sslCertPath: payload.https.enabled ? (payload.https.sslCertPath || '(missing)') : undefined,
        },
    });
}
