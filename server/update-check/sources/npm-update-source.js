import { fetchJson } from '../../utils/http.js';
import { isVersionGreater } from '../../utils/semver.js';
import { buildNpmGlobalUpdateCommand } from '../install-command.js';

export class NpmUpdateSource {
  constructor({ packageName, currentVersion }) {
    this.packageName = packageName;
    this.currentVersion = currentVersion;
  }

  async check() {
    if (!this.packageName || !this.currentVersion) {
      return { hasUpdate: false };
    }

    const url = `https://registry.npmjs.org/${encodeURIComponent(this.packageName)}/latest`;
    const data = await fetchJson(url);
    const latest = String(data.version || '').trim();
    if (!latest) {
      return { hasUpdate: false };
    }

    if (!isVersionGreater(latest, this.currentVersion)) {
      return { hasUpdate: false };
    }

    return {
      hasUpdate: true,
      key: `npm:${latest}`,
      title: 'Mise a jour disponible',
      message: `Version ${latest} disponible (actuelle: ${this.currentVersion}).`,
      ttlMs: 8000,
    };
  }

  getInstallCommand() {
    return buildNpmGlobalUpdateCommand(this.packageName);
  }
}
