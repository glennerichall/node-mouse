import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const vagrantDirectory = path.join(repositoryRoot, 'dev/vagrant');
const targets = {
  'linux-install': 'test/integration/vm/linux-install.test.js',
  'linux-x11': 'test/integration/vm-x11/linux-x11.test.js',
  'linux-wayland': 'test/integration/vm-wayland/linux-wayland.test.js',
};
const profile = process.argv[2];

if (!targets[profile]) {
  console.error(`Usage: node test/integration/run-vagrant.mjs <${Object.keys(targets).join('|')}>`);
  process.exit(2);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    stdio: 'inherit',
    env: process.env,
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const vagrantEnvironment = {
  ...process.env,
  VAGRANT_CWD: vagrantDirectory,
  VAGRANT_DEFAULT_PROVIDER: 'libvirt',
};
for (const args of [
  ['up', '--no-provision', profile],
  ['rsync', profile],
  ['provision', profile],
]) {
  run('vagrant', args, {env: vagrantEnvironment});
}

run('node', [
  '--experimental-vm-modules',
  'node_modules/jest/bin/jest.js',
  '--config', 'jest.integration.config.js',
  '--runInBand',
  '--runTestsByPath', targets[profile],
], {
  env: {...process.env, REMOTE_MOUSE_TEST_PROFILE: profile},
});
