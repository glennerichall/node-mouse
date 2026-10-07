import {readPackageVersion} from '../../utils/env.js';

export function createHealthHandler(packageJsonPath) {
  return (_req, res) => {
    res.json({
      ok: true,
      version: readPackageVersion(packageJsonPath),
    });
  };
}
