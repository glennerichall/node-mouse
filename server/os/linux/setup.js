import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

// Configure the system-level uinput permission rule through the Linux helper.
// This privileged operation is intentionally isolated from the shared setup flow.
export function configureUinputPermission(username) {
    const scriptPath = path.join(packageRoot, 'scripts', 'configure-uinput-access.sh');
    const result = spawnSync('pkexec', ['bash', scriptPath, username], {stdio: 'inherit'});
    return result.error || result.status !== 0
        ? {ok: false, message: result.error?.message || `uinput setup failed (exit code ${result.status}).`}
        : {ok: true, message: 'uinput permission configured.'};
}
