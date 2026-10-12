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
DEBIAN_FRONTEND=noninteractive apt-get install --yes build-essential libpng-dev libx11-dev libxtst-dev
tarball=$(npm pack --pack-destination /tmp --silent /workspace)
npm install -g "/tmp/$tarball"
remote-mouse setup --yes --no-service --config-dir /tmp/remote-mouse-config --port 3987
remote-mouse help
test -f /tmp/remote-mouse-config/.env
port=$(sed -n 's/^PORT=//p' /tmp/remote-mouse-config/.env | tail -n 1)
test "$port" = 3987 || { echo "Unexpected configured port: $port" >&2; exit 1; }
secret=$(sed -n 's/^SESSION_COOKIE_SECRET=//p' /tmp/remote-mouse-config/.env | tail -n 1)
test "\${#secret}" -ge 64 || { echo "Generated session secret is too short: \${#secret}" >&2; exit 1; }
remote-mouse version
`;

const result = await run(runtime, [
  'run',
  '--rm',
  '-v',
  `${workspace}:/workspace:ro`,
  '-w',
  '/workspace',
  'node:22-bookworm',
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
