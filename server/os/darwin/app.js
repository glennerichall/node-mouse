import fs from 'node:fs';
import {execFileAsync} from '../../utils/process.js';
import {buildAppWindowScript} from './applescript.js';

export function findInstalledDarwinApp(apps = []) {
  for (const appName of apps) {
    const locations = [
      `/Applications/${appName}.app`,
      `/System/Applications/${appName}.app`,
    ];
    if (locations.some((path) => fs.existsSync(path))) {
      return appName;
    }
  }
  return '';
}

export async function resolveDarwinApp(spec = {}) {
  const appName = findInstalledDarwinApp(spec.darwin?.apps ?? []);
  return appName ? {appName} : null;
}

export async function openOrFocusDarwinApp(spec) {
  const resolved = await resolveDarwinApp(spec);
  if (!resolved) {
    return false;
  }
  return (await execFileAsync('open', ['-a', resolved.appName])).ok;
}

export async function toggleDarwinAppWindow(spec) {
  const resolved = await resolveDarwinApp(spec);
  if (!resolved) {
    return false;
  }
  return (await execFileAsync('osascript', ['-e', buildAppWindowScript(resolved.appName, 'toggle')])).ok;
}

export async function closeDarwinAppWindow(spec) {
  const resolved = await resolveDarwinApp(spec);
  if (!resolved) {
    return false;
  }
  return (await execFileAsync('osascript', ['-e', buildAppWindowScript(resolved.appName, 'close')])).ok;
}
