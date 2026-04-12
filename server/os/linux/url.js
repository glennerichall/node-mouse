import {spawnDetached} from '../../utils/process.js';
import {commandExists} from './process.js';

export async function openLinuxUrl(url) {
  const safeUrl = String(url || '').trim();
  if (!safeUrl) {
    return false;
  }

  if (await commandExists('xdg-open')) {
    return spawnDetached('xdg-open', [safeUrl]);
  }
  if (await commandExists('gio')) {
    return spawnDetached('gio', ['open', safeUrl]);
  }
  return false;
}
