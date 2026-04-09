import {spawnDetached} from '../../utils/process.js';

export async function openWin32Url(url) {
  const safeUrl = String(url || '').trim();
  if (!safeUrl) {
    return false;
  }
  return spawnDetached('cmd', ['/c', 'start', '', safeUrl]);
}
