import process from 'node:process';
import {installGnomeFocusExtension, isGnomeWaylandSession} from '../server/term/cli/setup/gnomeFocusExtension.js';

export async function configureGnomeFocusAfterAppUpdate({
  env = process.env,
  platform = process.platform,
  install = installGnomeFocusExtension,
  stderr = process.stderr,
} = {}) {
  if (platform !== 'linux'
    || String(env.REMOTE_MOUSE_DAEMON || '') !== '1'
    || !isGnomeWaylandSession(env)) {
    return {attempted: false, configured: false};
  }

  try {
    const result = await install({env});
    if (result?.ok) return {attempted: true, configured: true};

    const message = result?.message || 'GNOME focus extension installation failed.';
    stderr.write(`GNOME focus migration not completed: ${message}\n`);
    return {attempted: true, configured: false, message};
  } catch (error) {
    stderr.write(`GNOME focus migration not completed: ${error.message}\n`);
    return {attempted: true, configured: false, error};
  }
}
