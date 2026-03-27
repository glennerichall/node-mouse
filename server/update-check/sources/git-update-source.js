import { runGit } from '../../../utils/server/git.js';
import { buildNpmGlobalUpdateCommand } from '../install-command.js';

export class GitUpdateSource {
  constructor({ remote, ref, packageName }) {
    this.remote = remote;
    this.ref = ref;
    this.packageName = packageName;
  }

  async isAvailable() {
    const inside = await runGit(['rev-parse', '--is-inside-work-tree']);
    return inside.ok && inside.stdout === 'true';
  }

  async check() {
    const local = await runGit(['rev-parse', 'HEAD']);
    if (!local.ok || !local.stdout) {
      return { hasUpdate: false };
    }

    const remote = await runGit(['ls-remote', this.remote, this.ref]);
    if (!remote.ok || !remote.stdout) {
      return { hasUpdate: false };
    }

    const remoteHead = remote.stdout.split('\n')[0].split(/\s+/)[0];
    const localHead = local.stdout;
    if (!remoteHead || remoteHead === localHead) {
      return { hasUpdate: false };
    }

    return {
      hasUpdate: true,
      key: `git:${remoteHead}`,
      title: 'Mise a jour Git disponible',
      message: `Nouveau commit disponible (${remoteHead.slice(0, 8)}), actuel ${localHead.slice(0, 8)}.`,
      ttlMs: 8000,
    };
  }

  getInstallCommand() {
    return buildNpmGlobalUpdateCommand(this.packageName);
  }
}
