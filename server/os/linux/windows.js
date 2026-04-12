import {execFileAsync} from '../../utils/process.js';
import {commandExists} from './process.js';

export function parseWindowIdsFromWmctrl(output, {classes = [], names = []} = {}) {
  const patterns = [...classes, ...names].map((value) => String(value).toLowerCase());

  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => patterns.some((pattern) => line.toLowerCase().includes(pattern)))
    .map((line) => line.split(/\s+/)[0])
    .filter((id) => /^0x[0-9a-f]+$/i.test(id));
}

export async function findWindows(query = {}) {
  if (await commandExists('wmctrl')) {
    const result = await execFileAsync('wmctrl', ['-lx']);
    if (result.ok) {
      const ids = parseWindowIdsFromWmctrl(result.stdout, query);
      if (ids.length > 0) {
        return ids;
      }
    }
  }

  if (!(await commandExists('xdotool'))) {
    return [];
  }

  const matches = [];
  for (const className of query.classes ?? []) {
    matches.push((await execFileAsync('xdotool', ['search', '--onlyvisible', '--class', className])).stdout);
    matches.push((await execFileAsync('xdotool', ['search', '--class', className])).stdout);
  }
  for (const name of query.names ?? []) {
    matches.push((await execFileAsync('xdotool', ['search', '--onlyvisible', '--name', name])).stdout);
    matches.push((await execFileAsync('xdotool', ['search', '--name', name])).stdout);
  }

  return matches
    .join('\n')
    .split('\n')
    .map((value) => value.trim())
    .filter((value) => /^\d+$/.test(value));
}

export async function activateWindow(windowId, {maximize = false} = {}) {
  if (await commandExists('wmctrl')) {
    const activated = await execFileAsync('wmctrl', ['-ia', String(windowId)]);
    if (!activated.ok) {
      return false;
    }
    if (maximize) {
      await execFileAsync('wmctrl', ['-ir', String(windowId), '-b', 'add,maximized_vert,maximized_horz']);
    }
    return true;
  }

  if (!(await commandExists('xdotool'))) {
    return false;
  }

  const activated = await execFileAsync('xdotool', ['windowactivate', '--sync', String(windowId)]);
  if (!activated.ok) {
    return false;
  }

  await execFileAsync('xdotool', ['windowraise', String(windowId)]);
  if (maximize && await commandExists('wmctrl')) {
    await execFileAsync('wmctrl', ['-ir', String(windowId), '-b', 'add,maximized_vert,maximized_horz']);
  }
  return true;
}

export async function maximizeWindow(windowId) {
  if (!(await commandExists('wmctrl'))) {
    return false;
  }

  return (await execFileAsync('wmctrl', ['-ir', String(windowId), '-b', 'add,maximized_vert,maximized_horz'])).ok;
}

export async function restoreWindow(windowId) {
  if (await commandExists('wmctrl')) {
    return (await execFileAsync('wmctrl', ['-ir', String(windowId), '-b', 'remove,maximized_vert,maximized_horz'])).ok;
  }

  return false;
}

export async function isWindowMaximized(windowId) {
  if (!(await commandExists('xprop'))) {
    return false;
  }

  const result = await execFileAsync('xprop', ['-id', String(windowId), '_NET_WM_STATE']);
  return result.ok
    && result.stdout.includes('_NET_WM_STATE_MAXIMIZED_VERT')
    && result.stdout.includes('_NET_WM_STATE_MAXIMIZED_HORZ');
}

export async function toggleWindow(windowId) {
  if (await isWindowMaximized(windowId)) {
    return restoreWindow(windowId);
  }
  return maximizeWindow(windowId);
}

export async function closeWindow(windowId) {
  if (await commandExists('wmctrl')) {
    return (await execFileAsync('wmctrl', ['-ic', String(windowId)])).ok;
  }

  if (await commandExists('xdotool')) {
    return (await execFileAsync('xdotool', ['windowclose', String(windowId)])).ok;
  }

  return false;
}

export async function getActiveWindowId() {
  if (await commandExists('xdotool')) {
    const result = await execFileAsync('xdotool', ['getactivewindow']);
    if (result.ok) {
      const id = result.stdout.trim();
      if (/^\d+$/.test(id)) {
        return id;
      }
    }
  }

  if (await commandExists('xprop')) {
    const result = await execFileAsync('xprop', ['-root', '_NET_ACTIVE_WINDOW']);
    if (result.ok) {
      const match = result.stdout.match(/0x[0-9a-f]+/i);
      if (match) {
        return match[0];
      }
    }
  }

  return '';
}
