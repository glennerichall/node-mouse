import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const linuxBuildScripts = [
  'build-uinput-bridge.sh',
  'build-xwayland-overlay.sh',
];

export function buildDevNative({
  platform = process.platform,
  run = (scriptPath) => spawnSync('bash', [scriptPath], {
    cwd: projectRoot,
    stdio: 'inherit',
  }),
  log = console.log,
} = {}) {
  if (platform !== 'linux') {
    log(`Skipping Linux native development builds on ${platform}.`);
    return;
  }

  for (const script of linuxBuildScripts) {
    const result = run(path.join(projectRoot, 'scripts', script));
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`Native development build '${script}' failed with status ${result.status ?? 'unknown'}.`);
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildDevNative();
}
