import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  PUBSUB_EVENT_ADMIN_RESTART_DETECTED,
  PUBSUB_SERVICE_ADMIN_RESTART_SERVICE,
} from '../../services/pubsub/serviceEventConstants.js';

const RESTART_MARKER_FILE = path.join(os.tmpdir(), 'remote-mouse-restarted.marker');
const RECENT_RESTART_WINDOW_MS = 60_000;
let lastRestartDetectedAt = 0;

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

export function notifyIfRestarted(events) {
  if (readAndClearRestartMarker()) {
    lastRestartDetectedAt = Date.now();
    events.publishEvent(PUBSUB_SERVICE_ADMIN_RESTART_SERVICE, PUBSUB_EVENT_ADMIN_RESTART_DETECTED, {});
  }
}

export function hasRecentRestart() {
  return lastRestartDetectedAt > 0 && (Date.now() - lastRestartDetectedAt) <= RECENT_RESTART_WINDOW_MS;
}
