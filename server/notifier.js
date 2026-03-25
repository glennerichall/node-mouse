import os from 'os';
import { execFile } from 'child_process';
import nodeNotifier from 'node-notifier';
import {
  DESKTOP_NOTIFICATIONS_ENABLED,
  CLIENT_NOTIFICATIONS_ENABLED,
  NOTIFICATION_TTL_MS,
} from '../utils/config.js';

function runExecFile(command, args) {
  return new Promise((resolve) => {
    execFile(command, args, { timeout: 3000 }, (error) => {
      resolve(!error);
    });
  });
}

export function createNotifier(io) {
  const platform = os.platform();

  function sendViaNodeNotifier({ title, message, safeTtlMs }) {
    try {
      nodeNotifier.notify({
        title,
        message,
        wait: false,
        sound: false,
        timeout: Math.max(1, Math.round(safeTtlMs / 1000)),
      });
    } catch (_error) {
      // Best effort.
    }
  }

  function notify({
    title = 'Remote Mouse',
    message,
    level = 'info',
    toDesktop = true,
    toClients = true,
    ttlMs = NOTIFICATION_TTL_MS,
  }) {
    if (!message) {
      return;
    }

    const safeTtlMs = Math.max(500, Math.round(ttlMs));

    const payload = {
      title,
      message,
      level,
      ttlMs: safeTtlMs,
      createdAt: Date.now(),
    };

    if (toClients && CLIENT_NOTIFICATIONS_ENABLED) {
      io.emit('notification', payload);
    }

    if (toDesktop && DESKTOP_NOTIFICATIONS_ENABLED) {
      if (platform === 'linux') {
        // Sur Linux/GNOME, notify-send -t est plus fiable pour l'expiration.
        runExecFile('notify-send', [
          '-u',
          level === 'error' ? 'critical' : 'normal',
          '-t',
          String(safeTtlMs),
          title,
          message,
        ]).then((ok) => {
          if (!ok) {
            sendViaNodeNotifier({ title, message, safeTtlMs });
          }
        });
      } else {
        sendViaNodeNotifier({ title, message, safeTtlMs });
      }
    }
  }

  return { notify };
}
