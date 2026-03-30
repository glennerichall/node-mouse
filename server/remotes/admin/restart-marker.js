import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const RESTART_MARKER_FILE = path.join(os.tmpdir(), 'remote-mouse-restarted.marker');

export function writeRestartMarker() {
  try {
    fs.writeFileSync(RESTART_MARKER_FILE, String(Date.now()), 'utf8');
  } catch (_error) {
    // best effort
  }
}

function readAndClearRestartMarker() {
  try {
    if (!fs.existsSync(RESTART_MARKER_FILE)) {
      return false;
    }
    fs.unlinkSync(RESTART_MARKER_FILE);
    return true;
  } catch (_error) {
    return false;
  }
}

export function notifyIfRestarted(notifier) {
  if (readAndClearRestartMarker()) {
    notifier.notify({
      level: 'info',
      title: 'Service redemarre',
      message: 'Le service Remote Mouse a redemarre avec succes.',
      ttlMs: 3000,
    });
  }
}
