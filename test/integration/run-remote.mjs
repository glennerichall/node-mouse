import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const targets = {
  'linux-install': 'test/integration/vm/linux-install.test.js',
  'linux-x11': 'test/integration/vm-x11/linux-x11.test.js',
  'linux-wayland': 'test/integration/vm-wayland/linux-wayland.test.js',
};
const profile = process.argv[2];
if (!targets[profile]) {
  console.error(`Usage: node test/integration/run-remote.mjs <${Object.keys(targets).join('|')}>`);
  process.exit(2);
}

const deployProfile = profile.replace(/^linux-/, '');
const deploy = spawnSync('bash', ['dev/deploy/deploy-linux.sh', deployProfile], {
  cwd: repositoryRoot, stdio: 'inherit', env: process.env,
});
if (deploy.status !== 0) process.exit(deploy.status ?? 1);

const result = spawnSync('node', [
  '--experimental-vm-modules', 'node_modules/jest/bin/jest.js',
  '--config', 'jest.integration.config.js', '--runInBand', '--runTestsByPath', targets[profile],
], {cwd: repositoryRoot, stdio: 'inherit', env: {...process.env, REMOTE_MOUSE_TEST_PROFILE: profile}});
process.exit(result.status ?? 1);
