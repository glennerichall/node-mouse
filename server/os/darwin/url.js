import {execFileAsync} from '../../utils/process.js';

export async function openDarwinUrl(url) {
  const safeUrl = String(url || '').trim();
  if (!safeUrl) {
    return false;
  }
  return (await execFileAsync('open', [safeUrl])).ok;
}
