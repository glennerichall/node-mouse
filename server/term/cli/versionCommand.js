import path from 'node:path';
import {projectRoot} from '../../utils/paths.js';
import {readPackageVersion} from '../../utils/env.js';

export function getInstalledVersion() {
  return readPackageVersion(path.join(projectRoot, 'package.json'));
}
