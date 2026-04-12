import {
    getEntrypoint,
    getPlatformKind,
    isDaemonProcess
} from "../../services/application/utils.js";
import {
    execFileAsync,
    spawnDetached
} from "../../utils/process.js";

function buildWindowsTaskCommand() {
    const nodePath = process.execPath.replace(/'/g, "''");
    const entrypoint = getEntrypoint().replace(/'/g, "''");
    return `powershell -NoProfile -WindowStyle Hidden -Command "$env:REMOTE_MOUSE_DAEMON='1'; & '${nodePath}' '${entrypoint}'"`;
}

export async function installWindowsDaemon(serviceName) {
    const result = await execFileAsync('schtasks', [
        '/Create',
        '/F',
        '/SC', 'ONLOGON',
        '/TN', serviceName,
        '/TR', buildWindowsTaskCommand(),
    ], {timeout: 30000});

    if (!result.ok) {
        return {ok: false, message: result.stderr || `Impossible d'installer la tache ${serviceName}.`};
    }

    const run = await execFileAsync('schtasks', ['/Run', '/TN', serviceName], {timeout: 10000});
    if (!run.ok) {
        return {ok: false, message: run.stderr || `Tache ${serviceName} creee mais non lancee.`};
    }

    return {
        ok: true,
        message: `Tache ${serviceName} installee et lancee.`,
    };
}

export async function disableWindowsDaemon(serviceName) {
    await execFileAsync('schtasks', ['/End', '/TN', serviceName], {timeout: 10000});
    const result = await execFileAsync('schtasks', ['/Change', '/TN', serviceName, '/Disable'], {timeout: 30000});
    if (!result.ok) {
        return {ok: false, message: result.stderr || `Impossible de desactiver la tache ${serviceName}.`};
    }

    return {
        ok: true,
        message: `Tache ${serviceName} desactivee.`,
    };
}

export async function uninstallWindowsDaemon(serviceName) {
    await execFileAsync('schtasks', ['/End', '/TN', serviceName], {timeout: 10000});
    const result = await execFileAsync('schtasks', ['/Delete', '/TN', serviceName, '/F'], {timeout: 30000});
    if (!result.ok) {
        return {ok: false, message: result.stderr || `Impossible de supprimer la tache ${serviceName}.`};
    }

    return {
        ok: true,
        message: `Tache ${serviceName} desinstallee.`,
    };
}

export async function restartWindowsDaemon(serviceName) {
    const command = `Start-Sleep -Milliseconds 800; schtasks /End /TN "${serviceName}" 2>$null; schtasks /Run /TN "${serviceName}"`;
    const spawned = await spawnDetached('powershell', ['-NoProfile', '-Command', command]);

    if (!spawned) {
        return {
            ok: false,
            message: 'Impossible de lancer la tache de redemarrage.',
            details: {message: 'spawn schtasks failed'},
        };
    }

    return {
        ok: true,
        message: `Redemarrage demande pour ${serviceName}.`,
    };
}

export async function getWindowsDaemonInfo(serviceName) {
    const result = await execFileAsync('schtasks', ['/Query', '/TN', serviceName], {timeout: 5000});

    return {
        serviceName,
        platform: process.platform,
        platformKind: getPlatformKind(),
        runningAsDaemon: isDaemonProcess(),
        installed: result.ok,
    };
}
