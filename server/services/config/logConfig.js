function emitConfigLine(logger, message, fields = {}) {
    if (logger && typeof logger.info === 'function') {
        logger.info(fields, message);
        return;
    }
    console.log(`${message} ${JSON.stringify(fields)}`);
}

export function logStartupConfig(logger, config) {
    const systemConfig = config.systemConfig;
    const persistedConfig = config.config;

    emitConfigLine(logger, 'Configuration');
    emitConfigLine(logger, 'config.network', {
        protocol: systemConfig.protocol,
        port: systemConfig.port,
        serverHost: systemConfig.serverHost || '(auto LAN detection)',
    });
    emitConfigLine(logger, 'config.entryPath', {
        ...systemConfig.entryPath,
        fixed: systemConfig.entryPath.fixed || '(random)',
    });
    emitConfigLine(logger, 'config.session', {
        ...systemConfig.session,
        cookieSecret: undefined,
    });
    emitConfigLine(logger, 'config.input', persistedConfig.input);
    emitConfigLine(logger, 'config.preview', persistedConfig.preview);
    emitConfigLine(logger, 'config.notifications', persistedConfig.notifications);
    emitConfigLine(logger, 'config.admin', {
        adminActionsEnabled: systemConfig.adminActionsEnabled,
        serviceName: systemConfig.serviceName,
    });
    emitConfigLine(logger, 'config.samsungTv', {
        ...persistedConfig.samsungTv,
        mac: persistedConfig.samsungTv.mac ? '(set)' : '(unset)',
    });
    emitConfigLine(logger, 'config.update', {
        ...systemConfig.updateCheck,
        ...persistedConfig.updateCheck,
        packageName: systemConfig.updateCheck.packageName || '(none)',
        currentVersion: systemConfig.updateCheck.currentVersion || '(none)',
        installCommand: systemConfig.updateCheck.installCommand || '(unset)',
    });
    emitConfigLine(logger, 'config.qrOverlay', persistedConfig.qrOverlay);
    emitConfigLine(logger, 'config.runtime', {
        graphicalDisplay: systemConfig.graphicalDisplay,
        https: {
            ...systemConfig.https,
            sslKeyPath: systemConfig.https.enabled ? (systemConfig.https.sslKeyPath || '(missing)') : undefined,
            sslCertPath: systemConfig.https.enabled ? (systemConfig.https.sslCertPath || '(missing)') : undefined,
        },
    });
}
