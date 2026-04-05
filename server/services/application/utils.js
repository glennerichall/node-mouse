import path from "node:path";
import {projectRoot} from "../../utils/paths.js";
import os from "node:os";

export function getPlatformKind() {
    if (process.platform === 'linux') {
        return 'systemd-user';
    }
    if (process.platform === 'win32') {
        return 'windows-scheduled-task';
    }
    return 'unsupported';
}

export function isDaemonProcess() {
    return String(process.env.REMOTE_MOUSE_DAEMON || '').trim() === '1';
}

export function getEntrypoint() {
    return path.join(projectRoot, 'bin', 'remote-mouse.js');
}

export function shellQuote(value) {
    return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

export function getSystemdUnitPath(serviceName) {
    return path.join(os.homedir(), '.config', 'systemd', 'user', serviceName);
}
