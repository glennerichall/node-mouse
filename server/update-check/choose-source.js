import {getStartupConfigSnapshot} from '../init/config.js';
import { GitUpdateSource } from './sources/git-update-source.js';
import { NpmUpdateSource } from './sources/npm-update-source.js';

const config = getStartupConfigSnapshot();

export async function chooseUpdateSource() {
  const requested = (config.updateCheck.source || 'auto').toLowerCase();
  const gitSource = new GitUpdateSource({
    remote: config.updateCheck.gitRemote,
    ref: config.updateCheck.gitRef,
    packageName: config.updateCheck.packageName,
  });
  const npmSource = new NpmUpdateSource({
    packageName: config.updateCheck.packageName,
    currentVersion: config.updateCheck.currentVersion,
  });

  if (requested === 'git') {
    return gitSource;
  }
  if (requested === 'npm') {
    return npmSource;
  }

  if (await gitSource.isAvailable()) {
    return gitSource;
  }
  return npmSource;
}
