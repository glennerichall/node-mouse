import {execFileAsync} from '../../utils/process.js';
import {buildActiveWindowScript} from './applescript.js';

export async function toggleDarwinActiveWindow() {
  return (await execFileAsync('osascript', ['-e', buildActiveWindowScript('toggle')])).ok;
}

export async function closeDarwinActiveWindow() {
  return (await execFileAsync('osascript', ['-e', buildActiveWindowScript('close')])).ok;
}
