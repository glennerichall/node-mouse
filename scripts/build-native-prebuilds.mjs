import {execFileSync, spawnSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdirSync, chmodSync} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {getLinuxNativeBuildPath, getLinuxNativePrebuildPath} from '../server/os/linux/nativeArtifactPaths.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED_COMPONENTS = ['uinput', 'xwaylandPointer', 'xwaylandOverlay'];
const OPTIONAL_COMPONENTS = ['waylandPortal'];
const BUILD_COMMANDS = {
  uinput: 'scripts/build-uinput-bridge.sh',
  xwaylandPointer: 'scripts/build-xwayland-pointer-bridge.sh',
  xwaylandOverlay: 'scripts/build-xwayland-overlay.sh',
  waylandPortal: 'scripts/build-wayland-helper.sh',
};

function run(command) {
  execFileSync('bash', [command], {cwd: projectRoot, stdio: 'inherit'});
}

export function buildNativePrebuilds({
  platform = process.platform,
  arch = process.arch,
  build = run,
  exists = existsSync,
  probe = spawnSync,
  copy = copyFileSync,
  makeDirectory = mkdirSync,
  setMode = chmodSync,
  root = projectRoot,
  env = process.env,
  stdout = process.stdout,
} = {}) {
  if (platform !== 'linux') {
    throw new Error('Native prebuilds are currently supported only on Linux build hosts.');
  }
  if (!['x64', 'arm64'].includes(arch)) {
    throw new Error(`Unsupported prebuild architecture: ${arch}; expected x64 or arm64.`);
  }

  const compiler = probe('cc', ['--version']);
  if (compiler.status !== 0) {
    throw new Error('A C compiler is required on the build host to prepare native prebuilds.');
  }

  for (const name of REQUIRED_COMPONENTS) {
    build(BUILD_COMMANDS[name]);
    const source = getLinuxNativeBuildPath(name, {root});
    if (!exists(source)) throw new Error(`Build did not produce required native component: ${source}`);
    const destination = getLinuxNativePrebuildPath(name, {arch, root});
    makeDirectory(path.dirname(destination), {recursive: true});
    copy(source, destination);
    if (name === 'xwaylandOverlay') setMode(destination, 0o755);
    stdout.write(`Prepared ${path.relative(root, destination)}\n`);
  }

  if (env.REMOTE_MOUSE_BUILD_LIBEI === '1') {
    const portalDependencies = probe('pkg-config', ['--exists', 'libei-1.0', 'liboeffis-1.0']);
    if (portalDependencies.status !== 0) {
      throw new Error('REMOTE_MOUSE_BUILD_LIBEI=1 requires pkg-config, libei and liboeffis development files.');
    }
    build(BUILD_COMMANDS.waylandPortal);
    const source = getLinuxNativeBuildPath('waylandPortal', {root});
    if (!exists(source)) throw new Error(`Build did not produce required native component: ${source}`);
    const destination = getLinuxNativePrebuildPath('waylandPortal', {arch, root});
    makeDirectory(path.dirname(destination), {recursive: true});
    copy(source, destination);
    setMode(destination, 0o755);
    stdout.write(`Prepared ${path.relative(root, destination)}\n`);
  } else {
    stdout.write('Skipping optional libei helper; set REMOTE_MOUSE_BUILD_LIBEI=1 to include it.\n');
  }

  return {platform, arch, components: [...REQUIRED_COMPONENTS,
    ...(env.REMOTE_MOUSE_BUILD_LIBEI === '1' ? OPTIONAL_COMPONENTS : []),
  ]};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    buildNativePrebuilds();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
