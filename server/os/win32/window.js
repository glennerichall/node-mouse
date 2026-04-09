import {execFileAsync} from '../../utils/process.js';
import {buildForegroundWindowPowerShell} from './powershell.js';

export async function toggleWin32ActiveWindow() {
  return (await execFileAsync('powershell', ['-NoProfile', '-Command', buildForegroundWindowPowerShell('toggle')])).ok;
}

export async function closeWin32ActiveWindow() {
  return (await execFileAsync('powershell', ['-NoProfile', '-Command', buildForegroundWindowPowerShell('close')])).ok;
}
