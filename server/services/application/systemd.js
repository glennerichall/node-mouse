import {projectRoot} from "../../utils/paths.js";
import {
    getEntrypoint,
    getPlatformKind,
    getSystemdUnitPath,
    isDaemonProcess,
    shellQuote,
} from "./utils.js";
import fs from "node:fs";
import path from "node:path";
import {
    execFileAsync,
    spawnDetached
} from "../../utils/process.js";

export function buildSystemdUnit({entrypoint, nodePath}) {
    const nodeBinDir = path.dirname(String(nodePath || process.execPath));
    const environmentPath = [nodeBinDir, '/usr/local/bin', '/usr/bin', '/bin']
        .filter(Boolean)
        .join(':');

    return [
        '[Unit]',
        'Description=Remote Mouse Server',
        'After=graphical-session.target network-online.target',
        'Wants=network-online.target',
        '',
        '[Service]',
        'Type=simple',
        `ExecStart=${entrypoint}`,
        'Restart=on-failure',
        'RestartSec=2',
        `Environment=PATH=${environmentPath}`,
        'Environment=NODE_ENV=production',
        'Environment=REMOTE_MOUSE_DAEMON=1',
        'PassEnvironment=DISPLAY WAYLAND_DISPLAY XAUTHORITY DBUS_SESSION_BUS_ADDRESS',
        '',
        '[Install]',
        'WantedBy=default.target',
        '',
    ].join('\n');
}

export async function installLinuxDaemon(serviceName) {
    const unitPath = getSystemdUnitPath(serviceName);
    fs.mkdirSync(path.dirname(unitPath), {recursive: true});
    fs.writeFileSync(unitPath, buildSystemdUnit({
        entrypoint: getEntrypoint(),
        nodePath: process.execPath,
    }), 'utf8');

    const reload = await execFileAsync('systemctl', ['--user', 'daemon-reload'], {timeout: 15000});
    if (!reload.ok) {
        return {ok: false, message: reload.stderr || 'systemctl --user daemon-reload a echoue.'};
    }

    const enable = await execFileAsync('systemctl', ['--user', 'enable', '--now', serviceName], {timeout: 30000});
    if (!enable.ok) {
        return {ok: false, message: enable.stderr || `Impossible d'installer ${serviceName}.`};
    }

    return {
        ok: true,
        message: `Service ${serviceName} installe via systemd utilisateur.`,
    };
}

export async function disableLinuxDaemon(serviceName) {
    const result = await execFileAsync('systemctl', ['--user', 'disable', '--now', serviceName], {timeout: 30000});
    if (!result.ok) {
        return {ok: false, message: result.stderr || `Impossible de desactiver ${serviceName}.`};
    }

    return {
        ok: true,
        message: `Service ${serviceName} desactive.`,
    };
}

export async function uninstallLinuxDaemon(serviceName) {
    const unitPath = getSystemdUnitPath(serviceName);

    await execFileAsync('systemctl', ['--user', 'disable', '--now', serviceName], {timeout: 30000});

    try {
        fs.unlinkSync(unitPath);
    } catch (error) {
        if (error?.code !== 'ENOENT') {
            return {
                ok: false,
                message: `Impossible de supprimer ${unitPath}.`,
                details: {message: error.message},
            };
        }
    }

    const reload = await execFileAsync('systemctl', ['--user', 'daemon-reload'], {timeout: 15000});
    if (!reload.ok) {
        return {ok: false, message: reload.stderr || 'systemctl --user daemon-reload a echoue.'};
    }

    await execFileAsync('systemctl', ['--user', 'reset-failed', serviceName], {timeout: 10000});

    return {
        ok: true,
        message: `Service ${serviceName} desinstalle.`,
    };
}

export async function restartLinuxDaemon(serviceName) {
    const spawned = await spawnDetached(
        'bash',
        ['-lc', `sleep 0.8; systemctl --user restart ${shellQuote(serviceName)}`],
    );

    if (!spawned) {
        return {
            ok: false,
            message: 'Impossible de lancer la commande de redemarrage.',
            details: {message: 'spawn systemctl failed'},
        };
    }

    return {
        ok: true,
        message: `Redemarrage demande pour ${serviceName}.`,
    };
}

export async function getLinuxDaemonInfo(serviceName) {
    const result = await execFileAsync('systemctl', ['--user', 'status', serviceName], {timeout: 5000});

    return {
        serviceName,
        platform: process.platform,
        platformKind: getPlatformKind(),
        runningAsDaemon: isDaemonProcess(),
        installed: result.ok,
    };
}
