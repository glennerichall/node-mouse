import {commandExists, spawnLinuxDesktopProcess} from './process.js';

export async function openLinuxUrl(url) {
  const safeUrl = String(url || '').trim();
  if (!safeUrl) {
    return false;
  }

  if (await commandExists('xdg-open')) {
    return spawnLinuxDesktopProcess('xdg-open', [safeUrl]);
  }
  if (await commandExists('gio')) {
    return spawnLinuxDesktopProcess('gio', ['open', safeUrl]);
  }
  return false;
}
