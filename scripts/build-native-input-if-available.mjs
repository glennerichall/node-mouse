import {execFileSync, spawnSync} from 'node:child_process';
import process from 'node:process';
import {configureUInputAfterAppUpdate} from './configure-uinput-after-update.mjs';

if (process.platform !== 'linux') {
  process.exit(0);
}

const compiler = spawnSync('cc', ['--version']);
if (compiler.status === 0) {
  execFileSync('bash', ['scripts/build-uinput-bridge.sh'], {stdio: 'inherit'});
} else {
  process.stderr.write('uinput bridge not built: install a C compiler, then run npm run build:uinput.\n');
}

const dependencies = spawnSync('pkg-config', ['--exists', 'libei-1.0', 'liboeffis-1.0']);
if (dependencies.status !== 0) {
  process.stderr.write(
    'Wayland helper not built: install pkg-config, libei-dev and liboeffis-dev, then run npm run build:wayland.\n',
  );
} else {
  execFileSync('bash', ['scripts/build-wayland-helper.sh'], {stdio: 'inherit'});
}

configureUInputAfterAppUpdate();
