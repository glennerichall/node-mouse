import {execFileAsync, spawnDetached} from '../../utils/process.js';
import {sleep} from '../shared.js';
import {activateWindow, closeWindow, findWindows, toggleWindow} from './windows.js';
import {resolveLinuxCommand} from './process.js';

export async function isAnyProcessRunning(processNames = []) {
  const checks = [];

  for (const processName of processNames) {
    checks.push(await execFileAsync('pgrep', ['-x', processName]));
    checks.push(await execFileAsync('pgrep', ['-f', processName]));
  }

  return checks.some((result) => result.ok);
}

export async function resolveLinuxApp(spec = {}) {
  const linux = spec.linux || {};
  let launchCommand = '';

  for (const command of linux.commands || []) {
    launchCommand = await resolveLinuxCommand(command);
    if (launchCommand) {
      break;
    }
  }

  if (launchCommand) {
    return {
      launchCommand,
      launchArgs: [],
      processNames: linux.processNames ?? linux.commands ?? [],
      windowQuery: {
        classes: linux.windowClasses ?? [],
        names: linux.windowNames ?? [],
      },
    };
  }

  const flatpakCommand = linux.flatpakAppId ? await resolveLinuxCommand('flatpak') : '';
  if (linux.flatpakAppId && flatpakCommand) {
    return {
      launchCommand: flatpakCommand,
      launchArgs: ['run', linux.flatpakAppId],
      processNames: linux.processNames ?? [],
      windowQuery: {
        classes: linux.windowClasses ?? [],
        names: linux.windowNames ?? [],
      },
    };
  }

  return null;
}

export async function openOrFocusLinuxApp(spec, {maximize = false} = {}) {
  const resolved = await resolveLinuxApp(spec);
  if (!resolved) {
    return false;
  }

  const windowIds = await findWindows(resolved.windowQuery);
  if (windowIds.length > 0) {
    return activateWindow(windowIds[0], {maximize});
  }

  const running = await isAnyProcessRunning(resolved.processNames);
  if (running) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const ids = await findWindows(resolved.windowQuery);
      if (ids.length > 0) {
        return activateWindow(ids[0], {maximize});
      }
      await sleep(250);
    }
  }

  const launched = await spawnDetached(resolved.launchCommand, resolved.launchArgs);
  if (!launched) {
    return false;
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const ids = await findWindows(resolved.windowQuery);
    if (ids.length > 0) {
      return activateWindow(ids[0], {maximize});
    }
    await sleep(350);
  }

  return true;
}

export async function toggleLinuxAppWindow(spec) {
  const resolved = await resolveLinuxApp(spec);
  if (!resolved) {
    return false;
  }

  const ids = await findWindows(resolved.windowQuery);
  if (ids.length === 0) {
    return openOrFocusLinuxApp(spec, {maximize: true});
  }

  return toggleWindow(ids[0]);
}

export async function closeLinuxAppWindow(spec) {
  const resolved = await resolveLinuxApp(spec);
  if (!resolved) {
    return false;
  }

  const ids = await findWindows(resolved.windowQuery);
  if (ids.length === 0) {
    return false;
  }

  return closeWindow(ids[0]);
}
