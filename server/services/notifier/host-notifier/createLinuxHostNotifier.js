import { execFileAsync } from '../../../utils/process.js';
import {NOTIFIER_LEVEL_ERROR} from '../createNotifierComposite.js';

export function createLinuxHostNotifier({ fallbackNotifier }) {
  return {
    notify({ title, message, level, ttlMs }) {
      const safeTtlMs = Math.max(500, Math.round(ttlMs));
      void (async () => {
        const result = await execFileAsync('notify-send', [
          '-u',
          level === NOTIFIER_LEVEL_ERROR ? 'critical' : 'normal',
          '-t',
          String(safeTtlMs),
          title,
          message,
        ]);
        if (!result.ok && fallbackNotifier) {
          fallbackNotifier.notify({ title, message, level, ttlMs: safeTtlMs });
        }
      })();
    },
  };
}
