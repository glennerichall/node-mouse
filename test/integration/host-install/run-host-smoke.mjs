import {spawn} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const command = process.argv[2] || (process.platform === 'win32' ? 'remote-mouse.cmd' : 'remote-mouse');
const root = await mkdtemp(path.join(os.tmpdir(), 'remote-mouse-ci-'));
const configDir = path.join(root, 'config');
const port = 3987;
const expectedVersion = JSON.parse(await readFile(path.resolve('package.json'), 'utf8')).version;

function run(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: {...process.env, ...(options.env || {})},
      stdio: options.stdio || 'inherit',
      windowsHide: true,
    });
    let stderr = '';
    child.stderr?.on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', (code) => resolve({code, stderr}));
  });
}

async function waitForHealth() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return await response.json();
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('The installed Remote Mouse server did not become healthy.');
}

let server;
try {
  const setup = await run([
    'setup', '--yes', '--no-service', '--config-dir', configDir, '--port', String(port),
  ]);
  if (setup.code !== 0) throw new Error(`remote-mouse setup failed with exit code ${setup.code}. ${setup.stderr}`);

  server = spawn(command, [], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CONFIG_DIR: configDir,
      ENV_FILE_PATH: path.join(configDir, '.env'),
      PORT: String(port),
    },
    stdio: 'inherit',
    windowsHide: true,
  });
  const health = await waitForHealth();
  if (health.ok !== true || health.version !== expectedVersion) {
    throw new Error(`Unexpected health response: ${JSON.stringify(health)}`);
  }
  console.log(`Installed server is healthy (${health.version}).`);
} finally {
  if (server && !server.killed) server.kill('SIGTERM');
  await rm(root, {recursive: true, force: true});
}
