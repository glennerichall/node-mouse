import {execFileSync, spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const configureScript = path.join(scriptDirectory, 'configure-uinput-access.sh');

export function resolveDesktopUser(env = process.env, userInfo = () => os.userInfo()) {
  return String(env.SUDO_USER || env.USER || env.LOGNAME || userInfo().username || '').trim();
}

export function hasUInputSystemAccess({
  user,
  ruleExists = existsSync('/etc/udev/rules.d/70-remote-mouse-uinput.rules'),
  run = spawnSync,
} = {}) {
  if (!user || !ruleExists) {
    return false;
  }

  const result = run('id', ['-nG', user], {encoding: 'utf8'});
  if (result.status !== 0) {
    return false;
  }

  return String(result.stdout || '').split(/\s+/).includes('remote-mouse-uinput');
}

export function configureUInputAfterAppUpdate({
  env = process.env,
  platform = process.platform,
  isConfigured = hasUInputSystemAccess,
  execute = execFileSync,
  stderr = process.stderr,
} = {}) {
  if (platform !== 'linux' || String(env.REMOTE_MOUSE_DAEMON || '') !== '1') {
    return {attempted: false, configured: false};
  }

  const user = resolveDesktopUser(env);
  if (!user) {
    stderr.write('uinput migration skipped: desktop user could not be determined.\n');
    return {attempted: false, configured: false};
  }

  if (isConfigured({user})) {
    return {attempted: false, configured: true};
  }

  try {
    execute('pkexec', ['bash', configureScript, user], {
      env,
      stdio: 'inherit',
    });
    return {attempted: true, configured: true};
  } catch (error) {
    stderr.write(
      `uinput migration not completed: run sudo bash "${configureScript}" "${user}".\n`,
    );
    return {attempted: true, configured: false, error};
  }
}
