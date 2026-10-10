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

function run(command, {env = process.env} = {}) {
  execFileSync('bash', [command], {cwd: projectRoot, stdio: 'inherit', env});
}

function getCompiler({arch, hostArch, env}) {
  if (env.CC) return env.CC;
  if (arch === hostArch) return 'cc';
  if (arch === 'arm64' && hostArch === 'x64') return 'aarch64-linux-gnu-gcc';
  throw new Error(`No default cross-compiler is configured for ${hostArch} -> ${arch}; set CC.`);
}

function assertBinaryArchitecture(filePath, arch, inspect) {
  const result = inspect(filePath);
  if (result.status !== 0) {
    throw new Error(`Could not inspect native artifact architecture for ${filePath}; install binutils (readelf).`);
  }
  const machine = result.stdout?.match(/^\s*Machine:\s*(.+)$/m)?.[1]?.trim();
  const expected = arch === 'arm64' ? /^(AArch64|ARM aarch64)$/i : /^(Advanced Micro Devices X86-64|x86-64)$/i;
  if (!machine || !expected.test(machine)) {
    throw new Error(`Native artifact ${filePath} has machine '${machine || 'unknown'}', expected ${arch}.`);
  }
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
  hostArch = process.arch,
  inspect = (filePath) => spawnSync('readelf', ['-h', filePath], {encoding: 'utf8'}),
} = {}) {
  if (platform !== 'linux') {
    throw new Error('Native prebuilds are currently supported only on Linux build hosts.');
  }
  if (!['x64', 'arm64'].includes(arch)) {
    throw new Error(`Unsupported prebuild architecture: ${arch}; expected x64 or arm64.`);
  }

  const compilerName = getCompiler({arch, hostArch, env});
  const compiler = probe(compilerName, ['--version']);
  if (compiler.status !== 0) {
    throw new Error(`C compiler '${compilerName}' is required to prepare Linux ${arch} native prebuilds.`);
  }
  const buildEnv = {...env, CC: compilerName};
  if (arch !== hostArch) stdout.write(`Cross-compiling Linux ${arch} artifacts with ${compilerName}.\n`);

  for (const name of REQUIRED_COMPONENTS) {
    build(BUILD_COMMANDS[name], {env: buildEnv});
    const source = getLinuxNativeBuildPath(name, {root});
    if (!exists(source)) throw new Error(`Build did not produce required native component: ${source}`);
    assertBinaryArchitecture(source, arch, inspect);
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
    build(BUILD_COMMANDS.waylandPortal, {env: buildEnv});
    const source = getLinuxNativeBuildPath('waylandPortal', {root});
    if (!exists(source)) throw new Error(`Build did not produce required native component: ${source}`);
    assertBinaryArchitecture(source, arch, inspect);
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
    const args = process.argv.slice(2);
    let arch = process.arch;
    for (let index = 0; index < args.length; index += 1) {
      if (args[index] === '--arch' && args[index + 1]) arch = args[++index];
      else if (args[index].startsWith('--arch=')) arch = args[index].slice('--arch='.length);
      else throw new Error(`Unknown build option: ${args[index]}`);
    }
    buildNativePrebuilds({arch});
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
