import {spawnSync} from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), '..');

function runNpm(args) {
  const result = spawnSync('npm', args, {
    cwd: projectRoot,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`npm ${args.join(' ')} failed with exit code ${result.status ?? 'unknown'}.`);
  }
}

/** Prepare and validate all supported Linux native artifacts before npm packs. */
export function prepareNpmPublish({
  platform = process.platform,
  arch = process.arch,
  run = runNpm,
} = {}) {
  if (platform !== 'linux' || arch !== 'x64') {
    throw new Error('npm publication preparation builds both architectures and requires a Linux x64 host.');
  }

  const commands = [
    ['run', 'check:version'],
    ['run', 'build:native:prebuild', '--', '--arch', 'x64'],
    ['run', 'build:native:prebuild', '--', '--arch', 'arm64'],
    ['run', 'verify:native:prebuilds'],
    ['run', 'verify:package'],
  ];

  for (const command of commands) run(command);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  try {
    prepareNpmPublish();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
