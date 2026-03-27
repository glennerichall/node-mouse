import { execFileAsync } from '../../../utils/server/process.js';

export async function focusOrLaunchBraveWin32() {
  await execFileAsync('powershell', ['-NoProfile', '-Command', 'Start-Process brave']);
}
