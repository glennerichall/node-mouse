import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {isDaemonProcess} from '../../services/application/utils.js';
import {
  PUBSUB_EVENT_ADMIN_RESTART_DETECTED,
  PUBSUB_SERVICE_ADMIN_RESTART_SERVICE,
} from '../../services/pubsub/serviceEventConstants.js';

const RESTART_MARKER_FILE = path.join(os.tmpdir(), 'remote-mouse-restarted.marker');
const RECENT_RESTART_WINDOW_MS = 60_000;
let lastRestartDetectedAt = 0;

export function writeRestartMarker(payload = {}) {
  try {
    fs.writeFileSync(RESTART_MARKER_FILE, JSON.stringify({
      requestedAt: Date.now(),
      ...payload,
    }), 'utf8');
  } catch (_error) {
    // best effort
  }
}

function readAndClearRestartMarker() {
  try {
    if (!fs.existsSync(RESTART_MARKER_FILE)) {
      return null;
    }
    const raw = fs.readFileSync(RESTART_MARKER_FILE, 'utf8');
    fs.unlinkSync(RESTART_MARKER_FILE);
    return JSON.parse(raw || '{}');
  } catch (_error) {
    return null;
  }
}

function getDaemonStartupCause() {
  return os.uptime() <= 300 ? 'reboot' : 'unexpected';
}

export function notifyIfRestarted(services) {
  const restartLogDao = services.getPersistence().restartLogDao;
  const marker = readAndClearRestartMarker();
  const startupAt = Date.now();
  const startupCause = isDaemonProcess() ? getDaemonStartupCause() : 'user';

  const lastEvent = restartLogDao?.getLastLifecycleEvent?.();
  if (lastEvent?.eventType === 'start') {
    restartLogDao.createLifecycleEvent({
      eventAt: startupAt,
      eventType: 'stop',
      cause: startupCause,
      source: 'inferred-stop',
      status: 'completed',
      details: {
        inferred: true,
        previousStartAt: lastEvent.requestedAt,
        systemUptimeSec: Math.floor(os.uptime()),
      },
    });
  }

  if (marker) {
    lastRestartDetectedAt = startupAt;
    restartLogDao?.updateRestartStatus(marker.restartId, {
      detectedAt: lastRestartDetectedAt,
      status: 'completed',
      details: {
        restartDetectedAt: lastRestartDetectedAt,
      },
    });
    restartLogDao?.createLifecycleEvent({
      eventAt: startupAt,
      eventType: 'start',
      cause: String(marker.cause || 'user'),
      source: 'restart-marker',
      status: 'completed',
      details: {
        restartId: marker.restartId ?? null,
      },
    });
    services.getEvents().publishEvent(PUBSUB_SERVICE_ADMIN_RESTART_SERVICE, PUBSUB_EVENT_ADMIN_RESTART_DETECTED, {});
    return;
  }

  restartLogDao?.createLifecycleEvent({
    eventAt: startupAt,
    eventType: 'start',
    cause: startupCause,
    source: isDaemonProcess() ? 'daemon-startup' : 'manual-startup',
    status: 'completed',
    details: {
      restartDetectedAt: startupAt,
      systemUptimeSec: Math.floor(os.uptime()),
    },
  });
}

export function hasRecentRestart() {
  return lastRestartDetectedAt > 0 && (Date.now() - lastRestartDetectedAt) <= RECENT_RESTART_WINDOW_MS;
}
