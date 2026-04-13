import {execFileAsync} from '../../utils/process.js';
import {buildForegroundWindowPowerShell, buildTitleActivationPowerShell} from './powershell.js';
import {commandExistsWin32} from './process.js';
import {findFirstAvailable} from "../../../utils/predicates.js";

export async function activateWin32Titles(titles = []) {
  if (!titles.length) {
    return false;
  }

  const result = await execFileAsync('powershell', [
    '-NoProfile',
    '-Command',
    buildTitleActivationPowerShell(titles),
  ]);

  return result.ok && result.stdout.trim() === 'true';
}

export async function resolveWin32App(spec = {}) {
  const win = spec.win32 || {};
  const command = await findFirstAvailable(win.commands, commandExistsWin32);
  if (!command) {
    return null;
  }

  return {
    command,
    titles: win.windowTitles ?? [],
  };
}

export async function openOrFocusWin32App(spec) {
  const resolved = await resolveWin32App(spec);
  if (!resolved) {
    return false;
  }

  if (await activateWin32Titles(resolved.titles)) {
    return true;
  }

  return (await execFileAsync('powershell', ['-NoProfile', '-Command', `Start-Process ${resolved.command}`])).ok;
}

export async function toggleWin32AppWindow(spec) {
  const resolved = await resolveWin32App(spec);
  if (!resolved) {
    return false;
  }
  if (!(await activateWin32Titles(resolved.titles))) {
    return false;
  }
  return (await execFileAsync('powershell', ['-NoProfile', '-Command', buildForegroundWindowPowerShell('toggle')])).ok;
}

export async function closeWin32AppWindow(spec) {
  const resolved = await resolveWin32App(spec);
  if (!resolved) {
    return false;
  }
  if (!(await activateWin32Titles(resolved.titles))) {
    return false;
  }
  return (await execFileAsync('powershell', ['-NoProfile', '-Command', buildForegroundWindowPowerShell('close')])).ok;
}
