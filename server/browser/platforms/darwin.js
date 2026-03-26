import { execFileAsync } from '../../../utils/process.js';

export async function focusOrLaunchBraveDarwin() {
  await execFileAsync('open', ['-a', 'Brave Browser']);
}
