import { execFile } from 'node:child_process';

export function runGit(args) {
  return new Promise((resolve) => {
    execFile('git', args, { timeout: 5000 }, (error, stdout = '', stderr = '') => {
      resolve({
        ok: !error,
        stdout: String(stdout).trim(),
        stderr: String(stderr).trim(),
      });
    });
  });
}
