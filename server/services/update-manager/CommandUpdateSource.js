import {execShell} from '../../utils/process.js';
import {createLogger} from '../log/logger.js';

const log = createLogger('update-check:command-source');

function normalizeCommandResult(rawText, fallbackTitle) {
  const text = String(rawText || '').trim();
  if (!text) {
    return { hasUpdate: false };
  }

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      const hasUpdate = Boolean(parsed.hasUpdate);
      if (!hasUpdate) {
        return { hasUpdate: false };
      }
      const key = String(parsed.key || `cmd:${Date.now()}`);
      const title = String(parsed.title || fallbackTitle);
      const message = String(parsed.message || 'Mise a jour detectee.');
      const ttlMs = Number(parsed.ttlMs) > 0 ? Number(parsed.ttlMs) : 8000;
      return { hasUpdate, key, title, message, ttlMs };
    }
  } catch (_error) {
    // Fall back to plain text protocol.
  }

  const token = text.toLowerCase();
  if (token === '0' || token === 'false' || token === 'no' || token === 'none') {
    return { hasUpdate: false };
  }

  if (token === '1' || token === 'true' || token === 'yes' || token === 'update' || token === 'has_update') {
    return {
      hasUpdate: true,
      key: `cmd:${Date.now()}`,
      title: fallbackTitle,
      message: 'Mise a jour detectee.',
      ttlMs: 8000,
    };
  }

  return {
    hasUpdate: true,
    key: `cmd:${text.slice(0, 64)}`,
    title: fallbackTitle,
    message: text,
    ttlMs: 8000,
  };
}

export class CommandUpdateSource {
  constructor({ checkCommand, timeoutSec }) {
    this.checkCommand = String(checkCommand || '').trim();
    this.timeoutMs = Math.max(1000, Math.round(Number(timeoutSec || 20) * 1000));
  }

  async check() {
    if (!this.checkCommand) {
      return { hasUpdate: false };
    }

    const result = await execShell(this.checkCommand, this.timeoutMs);
    if (!result.ok) {
      log.warn({ stderr: result.stderr, stdout: result.stdout }, 'Update check command failed');
      return { hasUpdate: false };
    }

    return normalizeCommandResult(result.stdout, 'Mise a jour detectee (commande)');
  }
}
