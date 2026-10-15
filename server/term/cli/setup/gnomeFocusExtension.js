import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileAsync} from '../../../utils/process.js';

export const GNOME_FOCUS_EXTENSION_ID = 'remote-mouse-focus@velor';
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export function isGnomeWaylandSession(env = process.env) {
  const desktop = String(env.XDG_CURRENT_DESKTOP || env.DESKTOP_SESSION || '').toLowerCase();
  return String(env.XDG_SESSION_TYPE || '').toLowerCase() === 'wayland'
    && (desktop.includes('gnome') || desktop.includes('ubuntu'));
}

export function getGnomeFocusExtensionSource(root = projectRoot) {
  return path.join(root, 'native', 'gnome-shell', GNOME_FOCUS_EXTENSION_ID);
}

export async function installGnomeFocusExtension({
  env = process.env,
  root = projectRoot,
  runCommand = execFileAsync,
} = {}) {
  const source = getGnomeFocusExtensionSource(root);
  const temporaryDir = fs.mkdtempSync(path.join(os.tmpdir(), 'remote-mouse-gnome-focus-'));
  const bundle = path.join(temporaryDir, `${GNOME_FOCUS_EXTENSION_ID}.shell-extension.zip`);

  try {
    const bundled = await runCommand('gnome-extensions', [
      'pack', '--force', '--out-dir', temporaryDir, source,
    ], {
      timeout: 5000,
      env,
    });
    if (!bundled.ok) return {ok: false, message: 'Unable to package the GNOME focus extension.'};

    const installed = await runCommand('gnome-extensions', ['install', '--force', '--print-uuid', bundle], {
      timeout: 5000,
      env,
    });
    if (!installed.ok) return {ok: false, message: 'Unable to install the GNOME focus extension.'};

    const listed = await runCommand('gnome-extensions', ['list', '--user'], {
      timeout: 5000,
      env,
    });
    if (!listed.ok || !listed.stdout.split(/\r?\n/).includes(GNOME_FOCUS_EXTENSION_ID)) {
      return {ok: false, message: 'GNOME did not register the focus extension after installation.'};
    }

    const enabled = await runCommand('gnome-extensions', ['enable', GNOME_FOCUS_EXTENSION_ID], {
      timeout: 5000,
      env,
    });
    return enabled.ok
      ? {ok: true, message: 'GNOME browser window focus extension enabled.'}
      : {ok: false, message: 'Unable to enable the GNOME focus extension.'};
  } finally {
    fs.rmSync(temporaryDir, {recursive: true, force: true});
  }
}
