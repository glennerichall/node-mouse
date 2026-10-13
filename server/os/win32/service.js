import fs from 'node:fs';
import path from 'node:path';
import {
    getEntrypoint,
    getPlatformKind,
    isDaemonProcess
} from "../../services/application/utils.js";
import {
    execFileAsync,
    spawnDetached
} from "../../utils/process.js";

function getWindowsTaskLauncherPath() {
  const configDir = String(process.env.CONFIG_DIR || '').trim();
  const envFilePath = String(process.env.ENV_FILE_PATH || '').trim();
  const launcherDir = configDir || (envFilePath ? path.dirname(envFilePath) : process.cwd());
  return path.win32.join(launcherDir, 'remote-mouse-service.cmd');
}

function writeWindowsTaskLauncher() {
  const launcherPath = getWindowsTaskLauncherPath();
  const nodePath = process.execPath.replace(/%/g, '%%').replace(/"/g, '""');
  const entrypoint = getEntrypoint().replace(/%/g, '%%').replace(/"/g, '""');
  const configDir = String(process.env.CONFIG_DIR || '').replace(/%/g, '%%').replace(/"/g, '""');
  const envFilePath = String(process.env.ENV_FILE_PATH || '').replace(/%/g, '%%').replace(/"/g, '""');
  const lines = [
    '@echo off',
    configDir ? `set "CONFIG_DIR=${configDir}"` : '',
    envFilePath ? `set "ENV_FILE_PATH=${envFilePath}"` : '',
    'set "REMOTE_MOUSE_DAEMON=1"',
    `"${nodePath}" "${entrypoint}" %*`,
    '',
  ].filter(Boolean);
  fs.writeFileSync(launcherPath, `${lines.join('\r\n')}\r\n`, 'utf8');
  return launcherPath;
}

function buildWindowsTaskCommand(launcherPath = writeWindowsTaskLauncher()) {
  const launcher = String(launcherPath).replace(/"/g, '""');
  return `cmd.exe /d /c ""${launcher}""`;
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
        return {ok: false, message: result.stderr || `Unable to install the scheduled task ${serviceName}.`};
    }

    const run = await execFileAsync('schtasks', ['/Run', '/TN', serviceName], {timeout: 10000});
    if (!run.ok) {
        return {ok: false, message: run.stderr || `Scheduled task ${serviceName} was created but could not be started.`};
    }

    return {
        ok: true,
        message: `Scheduled task ${serviceName} installed and started.`,
    };
}

export async function disableWindowsDaemon(serviceName) {
    await execFileAsync('schtasks', ['/End', '/TN', serviceName], {timeout: 10000});
    const result = await execFileAsync('schtasks', ['/Change', '/TN', serviceName, '/Disable'], {timeout: 30000});
    if (!result.ok) {
        return {ok: false, message: result.stderr || `Unable to disable the scheduled task ${serviceName}.`};
    }

    return {
        ok: true,
        message: `Scheduled task ${serviceName} disabled.`,
    };
}

export async function uninstallWindowsDaemon(serviceName) {
    await execFileAsync('schtasks', ['/End', '/TN', serviceName], {timeout: 10000});
    const result = await execFileAsync('schtasks', ['/Delete', '/TN', serviceName, '/F'], {timeout: 30000});
    if (!result.ok) {
        return {ok: false, message: result.stderr || `Unable to remove the scheduled task ${serviceName}.`};
    }

    return {
        ok: true,
        message: `Scheduled task ${serviceName} removed.`,
    };
}

export async function restartWindowsDaemon(serviceName) {
    const command = `Start-Sleep -Milliseconds 800; schtasks /End /TN "${serviceName}" 2>$null; schtasks /Run /TN "${serviceName}"`;
    const spawned = await spawnDetached('powershell', ['-NoProfile', '-Command', command]);

    if (!spawned) {
        return {
            ok: false,
            message: 'Unable to launch the scheduled task restart command.',
            details: {message: 'Failed to spawn schtasks'},
        };
    }

    return {
        ok: true,
        message: `Restart requested for ${serviceName}.`,
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
