import {execFileSync, spawnSync} from 'node:child_process';
import process from 'node:process';

if (process.platform !== 'linux') {
  process.exit(0);
}

const dependencies = spawnSync('pkg-config', ['--exists', 'libei-1.0', 'liboeffis-1.0']);
if (dependencies.status !== 0) {
  process.stderr.write(
    'Wayland helper not built: install pkg-config, libei-dev and liboeffis-dev, then run npm run build:wayland.\n',
  );
  process.exit(0);
}

execFileSync('bash', ['scripts/build-wayland-helper.sh'], {stdio: 'inherit'});
