import {spawn} from 'node:child_process';
import {mkdtemp, readFile, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const command = process.argv[2] || (process.platform === 'win32' ? 'remote-mouse.cmd' : 'remote-mouse');
const root = await mkdtemp(path.join(os.tmpdir(), 'remote-mouse-ci-'));
const configDir = path.join(root, 'config');
const port = 3987;
const expectedVersion = JSON.parse(await readFile(path.resolve('package.json'), 'utf8')).version;

function execute(executable, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
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

function run(args, options = {}) {
  return execute(command, args, options);
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
let serviceInstalled = false;
let runtimeEnv;
try {
  const setup = await run([
    'setup', '--yes', '--no-service', '--config-dir', configDir, '--port', String(port),
  ]);
  if (setup.code !== 0) throw new Error(`remote-mouse setup failed with exit code ${setup.code}. ${setup.stderr}`);
  const initialConfig = await readFile(path.join(configDir, '.env'), 'utf8');
  const rerunSetup = await run([
    'setup', '--yes', '--no-service', '--config-dir', configDir, '--port', String(port),
  ]);
  if (rerunSetup.code !== 0) throw new Error(`second remote-mouse setup failed with exit code ${rerunSetup.code}. ${rerunSetup.stderr}`);
  const rerunConfig = await readFile(path.join(configDir, '.env'), 'utf8');
  if (rerunConfig !== initialConfig) throw new Error('Repeated setup changed the existing configuration.');

  runtimeEnv = {
    ...process.env,
    CONFIG_DIR: configDir,
    ENV_FILE_PATH: path.join(configDir, '.env'),
    PORT: String(port),
  };

  let systemd = {code: 1};
  if (process.platform === 'linux') {
    try {
      systemd = await execute('systemctl', ['--user', 'show-environment'], {
        env: runtimeEnv,
        stdio: 'ignore',
      });
    } catch {
      systemd = {code: 1};
    }
  }
  const useService = process.platform === 'win32' || systemd.code === 0;

  if (useService) {
    const serviceSetup = await run([
      'setup', '--yes', '--config-dir', configDir, '--port', String(port),
    ], {env: runtimeEnv});
    if (serviceSetup.code !== 0) {
      throw new Error(`Windows service setup failed with exit code ${serviceSetup.code}. ${serviceSetup.stderr}`);
    }
    serviceInstalled = true;
    if (process.platform === 'linux') console.log('systemd --user service is available and active validation is enabled.');
  } else {
    if (process.platform === 'linux') console.log('systemd --user unavailable; service validation skipped.');
    server = spawn(command, [], {
      cwd: process.cwd(),
      env: runtimeEnv,
      stdio: 'inherit',
      windowsHide: true,
      shell: process.platform === 'win32',
    });
  }
  const health = await waitForHealth();
  if (health.ok !== true || health.version !== expectedVersion) {
    throw new Error(`Unexpected health response: ${JSON.stringify(health)}`);
  }
  for (const args of [['version'], ['help'], ['config'], ['info']]) {
    const result = await run(args, {env: runtimeEnv});
    if (result.code !== 0) {
      throw new Error(`remote-mouse ${args[0]} failed with exit code ${result.code}. ${result.stderr}`);
    }
  }
  console.log(`Installed server is healthy (${health.version}).`);
} finally {
  if (server) await stopProcess(server);
  if (serviceInstalled) {
    const serviceRemoval = await run(['service', 'uninstall'], {env: runtimeEnv});
    if (serviceRemoval.code !== 0) {
      console.error(`Windows service cleanup failed with exit code ${serviceRemoval.code}. ${serviceRemoval.stderr}`);
    }
  }
  await removeTemporaryDirectory(root);
}
