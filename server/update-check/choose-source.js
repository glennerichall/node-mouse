import {
  UPDATE_CHECK_SOURCE,
  UPDATE_CHECK_PACKAGE,
  UPDATE_CHECK_CURRENT_VERSION,
  UPDATE_CHECK_GIT_REMOTE,
  UPDATE_CHECK_GIT_REF,
} from '../config.js';
import { GitUpdateSource } from './sources/git-update-source.js';
import { NpmUpdateSource } from './sources/npm-update-source.js';

export async function chooseUpdateSource() {
  const requested = (UPDATE_CHECK_SOURCE || 'auto').toLowerCase();
  const gitSource = new GitUpdateSource({
    remote: UPDATE_CHECK_GIT_REMOTE,
    ref: UPDATE_CHECK_GIT_REF,
    packageName: UPDATE_CHECK_PACKAGE,
  });
  const npmSource = new NpmUpdateSource({
    packageName: UPDATE_CHECK_PACKAGE,
    currentVersion: UPDATE_CHECK_CURRENT_VERSION,
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
