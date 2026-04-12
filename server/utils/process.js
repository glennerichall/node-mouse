import { exec, execFile, spawn } from 'node:child_process';

export function execFileAsync(command, args = [], options = {}) {
  const timeout = options.timeout ?? 3000;
  return new Promise((resolve) => {
    execFile(command, args, {
      timeout,
      env: options.env,
      maxBuffer: options.maxBuffer,
    }, (error, stdout = '', stderr = '') => {
      resolve({
        ok: !error,
        stdout: String(stdout),
        stderr: String(stderr),
      });
    });
  });
}

export function execShell(command, timeoutMs) {
  return new Promise((resolve) => {
    exec(command, { timeout: timeoutMs, maxBuffer: 1024 * 1024 }, (error, stdout = '', stderr = '') => {
      resolve({
        ok: !error,
        stdout: String(stdout).trim(),
        stderr: String(stderr).trim(),
      });
    });
  });
}

export function spawnDetached(command, args = []) {
  return new Promise((resolve) => {
    try {
      const child = spawn(command, args, {
        detached: true,
        stdio: 'ignore',
      });

      let settled = false;
      const done = (value) => {
        if (!settled) {
          settled = true;
          resolve(value);
        }
      };

      child.once('error', () => done(false));
      child.once('spawn', () => {
        child.unref();
        done(true);
      });
    } catch (_error) {
      resolve(false);
    }
  });
}
