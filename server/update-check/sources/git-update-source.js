import { runGit } from '../../utils/git.js';
import { buildGitUpdateCommand } from '../install-command.js';
import {createLogger} from '../../log/logger.js';

const log = createLogger('update-check:git-source');

export class GitUpdateSource {
  constructor({ remote, ref, packageName }) {
    this.remote = remote;
    this.ref = ref;
    this.packageName = packageName;
  }

  async isAvailable() {
    const inside = await runGit(['rev-parse', '--is-inside-work-tree']);
    log.debug({ ok: inside.ok, stdout: inside.stdout }, 'Git source availability check');
    return inside.ok && inside.stdout === 'true';
  }

  async check() {
    log.debug({ remote: this.remote, ref: this.ref }, 'Git update check start');
    const local = await runGit(['rev-parse', 'HEAD']);
    if (!local.ok || !local.stdout) {
      log.warn({ ok: local.ok, stderr: local.stderr }, 'Git update check: local HEAD unavailable');
      return { hasUpdate: false };
    }

    const remote = await runGit(['ls-remote', this.remote, this.ref]);
    if (!remote.ok || !remote.stdout) {
      log.warn({ ok: remote.ok, stderr: remote.stderr, remote: this.remote, ref: this.ref }, 'Git update check: remote HEAD unavailable');
      return { hasUpdate: false };
    }

    const remoteHead = remote.stdout.split('\n')[0].split(/\s+/)[0];
    const localHead = local.stdout;
    if (!remoteHead || remoteHead === localHead) {
      log.debug({ localHead: localHead.slice(0, 8), remoteHead: String(remoteHead || '').slice(0, 8) }, 'Git update check: no update');
      return { hasUpdate: false };
    }

    log.info({ localHead: localHead.slice(0, 8), remoteHead: remoteHead.slice(0, 8) }, 'Git update detected');

    return {
      hasUpdate: true,
      key: `git:${remoteHead}`,
      title: 'Mise a jour Git disponible',
      message: `Nouveau commit disponible (${remoteHead.slice(0, 8)}), actuel ${localHead.slice(0, 8)}.`,
      ttlMs: 8000,
    };
  }

  getInstallCommand() {
    return buildGitUpdateCommand(this.remote, this.ref);
  }
}
