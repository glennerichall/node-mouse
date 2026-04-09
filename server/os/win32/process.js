import {spawn} from 'node:child_process';
import {execFileAsync} from '../../utils/process.js';

export async function commandExistsWin32(command) {
  const result = await execFileAsync('powershell', [
    '-NoProfile',
    '-Command',
    `if (Get-Command "${command}" -ErrorAction SilentlyContinue) { "true" }`,
  ]);

  return result.ok && result.stdout.trim() === 'true';
}

export function spawnPowerShellFile(scriptPath) {
  return spawn(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
    {stdio: 'ignore'},
  );
}
