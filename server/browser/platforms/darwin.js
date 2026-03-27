import { execFileAsync } from '../../../utils/server/process.js';

export async function focusOrLaunchBraveDarwin() {
  await execFileAsync('open', ['-a', 'Brave Browser']);
}
