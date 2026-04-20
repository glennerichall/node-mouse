import {spawn} from 'node:child_process';

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      process.stdout.write(chunk);
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });
    child.on('error', (error) => {
      resolve({code: 127, stdout, stderr: `${stderr}${error.message}`});
    });
    child.on('close', (code) => {
      resolve({code, stdout, stderr});
    });
  });
}

async function commandExists(command) {
  const result = await run('sh', ['-lc', `command -v ${command}`]);
  return result.code === 0;
}

async function canUseContainerRuntime(command) {
  const result = await run(command, ['info']);
  if (result.code === 0) {
    return true;
  }

  console.error(`${command} is installed but not usable from this user.`);
  if (result.stderr.trim()) {
    console.error(result.stderr.trim());
  }
  return false;
}

async function resolveContainerRuntime() {
  if (await commandExists('docker') && await canUseContainerRuntime('docker')) {
    return 'docker';
  }
  if (await commandExists('podman') && await canUseContainerRuntime('podman')) {
    return 'podman';
  }
  return '';
}

const runtime = await resolveContainerRuntime();
if (!runtime) {
  console.error('Docker or Podman must be installed and usable by the current user for the Linux install integration test.');
  console.error('For Docker on Linux, add your user to the docker group or run the command with appropriate privileges.');
  process.exit(1);
}

const workspace = process.cwd();
const containerScript = `
set -euo pipefail
apt-get update
apt-get install -y bash ca-certificates
rm -rf /tmp/remote-mouse-package
mkdir -p /tmp/remote-mouse-package
tar --exclude=.git --exclude=node_modules -C /workspace -cf - . | tar -C /tmp/remote-mouse-package -xf -
scripts/install-linux.sh \\
  -y \\
  --package /tmp/remote-mouse-package \\
  --config-dir /tmp/remote-mouse-config \\
  --port 3987 \\
  --no-https \\
  --no-service
remote-mouse help
test -f /tmp/remote-mouse-config/.env
grep -q '^PORT=3987$' /tmp/remote-mouse-config/.env
grep -q '^HTTPS=false$' /tmp/remote-mouse-config/.env
`;

const result = await run(runtime, [
  'run',
  '--rm',
  '-v',
  `${workspace}:/workspace:ro`,
  '-w',
  '/workspace',
  'ubuntu:24.04',
  'bash',
  '-lc',
  containerScript,
], {
  cwd: workspace,
  env: process.env,
});

if (result.code !== 0) {
  console.error(`Linux install integration test failed with exit code ${result.code}.`);
  process.exit(result.code || 1);
}

console.log('Linux install integration test passed.');
