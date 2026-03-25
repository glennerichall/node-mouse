import https from 'https';
import {
  UPDATE_CHECK_ENABLED,
  UPDATE_CHECK_INTERVAL_MIN,
  UPDATE_CHECK_PACKAGE,
  UPDATE_CHECK_CURRENT_VERSION,
} from '../utils/config.js';

function fetchLatestVersion(pkgName) {
  const url = `https://registry.npmjs.org/${encodeURIComponent(pkgName)}/latest`;

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          reject(new Error(`HTTP ${res.statusCode}`));
          res.resume();
          return;
        }

        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve(String(parsed.version || '').trim());
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', reject);
  });
}

function parseSemver(version) {
  const normalized = version.replace(/^v/i, '').trim();
  const [core] = normalized.split('-');
  const parts = core.split('.');
  if (parts.length < 1 || parts.length > 3) {
    return null;
  }
  const nums = parts.map((part) => Number(part));
  if (nums.some((n) => !Number.isInteger(n) || n < 0)) {
    return null;
  }
  while (nums.length < 3) {
    nums.push(0);
  }
  return nums;
}

function isVersionGreater(a, b) {
  const av = parseSemver(a);
  const bv = parseSemver(b);
  if (!av || !bv) {
    return false;
  }
  for (let i = 0; i < 3; i += 1) {
    if (av[i] > bv[i]) {
      return true;
    }
    if (av[i] < bv[i]) {
      return false;
    }
  }
  return false;
}

export function startUpdateChecker(notifier) {
  if (!UPDATE_CHECK_ENABLED || !UPDATE_CHECK_PACKAGE || !UPDATE_CHECK_CURRENT_VERSION) {
    return { stop: () => {} };
  }

  let active = true;
  let lastNotifiedVersion = '';

  async function checkOnce() {
    try {
      const latest = await fetchLatestVersion(UPDATE_CHECK_PACKAGE);
      if (!latest) {
        return;
      }

      if (
        isVersionGreater(latest, UPDATE_CHECK_CURRENT_VERSION)
        && latest !== lastNotifiedVersion
      ) {
        lastNotifiedVersion = latest;
        notifier.notify({
          level: 'warning',
          title: 'Mise a jour disponible',
          message: `Version ${latest} disponible (actuelle: ${UPDATE_CHECK_CURRENT_VERSION}).`,
          ttlMs: 8000,
        });
      }
    } catch (_error) {
      // Best effort.
    }
  }

  const intervalMs = Math.max(60_000, UPDATE_CHECK_INTERVAL_MIN * 60_000);
  const timer = setInterval(() => {
    if (active) {
      checkOnce();
    }
  }, intervalMs);

  checkOnce();

  return {
    stop() {
      active = false;
      clearInterval(timer);
    },
  };
}

