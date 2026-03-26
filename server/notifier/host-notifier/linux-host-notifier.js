import { execFileAsync } from '../../../utils/process.js';

export function createLinuxHostNotifier({ fallbackNotifier }) {
  return {
    notify({ title, message, level, ttlMs }) {
      const safeTtlMs = Math.max(500, Math.round(ttlMs));
      execFileAsync('notify-send', [
        '-u',
        level === 'error' ? 'critical' : 'normal',
        '-t',
        String(safeTtlMs),
        title,
        message,
      ]).then((result) => {
        if (!result.ok && fallbackNotifier) {
          fallbackNotifier.notify({ title, message, level, ttlMs: safeTtlMs });
        }
      });
    },
  };
}
