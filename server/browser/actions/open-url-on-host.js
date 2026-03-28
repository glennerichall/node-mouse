import os from 'os';
import {commandExists, execFileAsync, spawnDetached} from '../../../utils/server/process.js';

export async function openUrlOnHost(url) {
  const safeUrl = String(url || '').trim();
  if (!safeUrl) {
    return false;
  }

  const platform = os.platform();
  if (platform === 'linux') {
    if (await commandExists('xdg-open')) {
      return spawnDetached('xdg-open', [safeUrl]);
    }
    if (await commandExists('gio')) {
      return spawnDetached('gio', ['open', safeUrl]);
    }
    return false;
  }

  if (platform === 'darwin') {
    const result = await execFileAsync('open', [safeUrl]);
    return result.ok;
  }

  if (platform === 'win32') {
    return spawnDetached('cmd', ['/c', 'start', '', safeUrl]);
  }

  return false;
}
