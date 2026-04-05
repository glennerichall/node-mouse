import {getPlatformKind} from "./utils.js";
import {
    disableLinuxDaemon,
    getLinuxDaemonInfo,
    installLinuxDaemon,
    uninstallLinuxDaemon,
    restartLinuxDaemon
} from "./systemd.js";
import {
    disableWindowsDaemon,
    getWindowsDaemonInfo,
    installWindowsDaemon,
    uninstallWindowsDaemon,
    restartWindowsDaemon
} from "./windows.js";

export function getPlatformAdapter() {
    const platformKind = getPlatformKind();

    if (platformKind === 'systemd-user') {
        return {
            platformKind,
            install: installLinuxDaemon,
            disable: disableLinuxDaemon,
            uninstall: uninstallLinuxDaemon,
            restart: restartLinuxDaemon,
            getInfo: getLinuxDaemonInfo,
        };
    }

    if (platformKind === 'windows-scheduled-task') {
        return {
            platformKind,
            install: installWindowsDaemon,
            disable: disableWindowsDaemon,
            uninstall: uninstallWindowsDaemon,
            restart: restartWindowsDaemon,
            getInfo: getWindowsDaemonInfo,
        };
    }

    return {
        platformKind,
        install: null,
        disable: null,
        uninstall: null,
        restart: null,
        getInfo: async (serviceName) => ({
            serviceName,
            platform: process.platform,
            platformKind,
            runningAsDaemon: false,
            installed: false,
        }),
    };
}
