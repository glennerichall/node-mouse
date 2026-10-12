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
      shell: process.platform === 'win32',
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

function stopProcess(child) {
  return new Promise((resolve) => {
    let timer;
    const finish = () => {
      clearTimeout(timer);
      resolve();
    };
    if (child.exitCode !== null || child.signalCode !== null) {
      finish();
      return;
    }
    child.once('close', finish);
    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
      killer.once('close', () => {
        timer = setTimeout(() => {
          if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
        }, 5_000);
      });
      return;
    }
    child.kill('SIGTERM');
    timer = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }, 5_000);
  });
}

async function removeTemporaryDirectory(directory) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await rm(directory, {recursive: true, force: true});
      return;
    } catch (error) {
      if (error.code !== 'EBUSY' || attempt === 19) throw error;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
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
    shell: process.platform === 'win32',
  });
  const health = await waitForHealth();
  if (health.ok !== true || health.version !== expectedVersion) {
    throw new Error(`Unexpected health response: ${JSON.stringify(health)}`);
  }
  console.log(`Installed server is healthy (${health.version}).`);
} finally {
  if (server) await stopProcess(server);
  await removeTemporaryDirectory(root);
}
