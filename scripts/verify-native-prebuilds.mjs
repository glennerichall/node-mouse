import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHITECTURES = ['x64', 'arm64'];
const COMPONENT_FILES = [
  'remote-mouse-uinput.node',
  'remote-mouse-xwayland-pointer.node',
  'remote-mouse-xwayland-overlay',
];
export function getMissingNativePrebuilds({root = projectRoot, exists = existsSync} = {}) {
  return ARCHITECTURES.flatMap((arch) => COMPONENT_FILES
    .map((file) => path.join(root, 'prebuilds', `linux-${arch}`, file))
    .filter((filePath) => !exists(filePath)));
}

export function verifyNativePrebuildPackage({
  root = projectRoot,
  exists = existsSync,
  inspect = (filePath) => spawnSync('readelf', ['-h', filePath], {encoding: 'utf8'}),
  pack = () => spawnSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: root,
    encoding: 'utf8',
  }),
  stderr = process.stderr,
} = {}) {
  const missing = getMissingNativePrebuilds({root, exists});
  if (missing.length) {
    stderr.write(`Missing project native prebuilds:\n${missing.map((file) => ` - ${file}`).join('\n')}\n`);
    return false;
  }

  for (const arch of ARCHITECTURES) {
    const expected = arch === 'arm64' ? /^(AArch64|ARM aarch64)$/i : /^(Advanced Micro Devices X86-64|x86-64)$/i;
    for (const file of COMPONENT_FILES) {
      const filePath = path.join(root, 'prebuilds', `linux-${arch}`, file);
      const result = inspect(filePath);
      const machine = result.stdout?.match(/^\s*Machine:\s*(.+)$/m)?.[1]?.trim();
      if (result.status !== 0 || !machine || !expected.test(machine)) {
        stderr.write(`Native prebuild has wrong or unreadable ELF architecture: ${filePath} (found ${machine || 'unknown'}, expected ${arch}).\n`);
        return false;
      }
    }
  }

  const result = pack();
  if (result.status !== 0) {
    stderr.write(result.stderr || 'npm pack --dry-run failed.\n');
    return false;
  }

  let files;
  try {
    files = JSON.parse(result.stdout)[0]?.files?.map(({path: filePath}) => filePath) || [];
  } catch {
    stderr.write('Could not parse npm pack --dry-run output.\n');
    return false;
  }

  const missingFromPackage = ARCHITECTURES.flatMap((arch) => COMPONENT_FILES
    .map((file) => `prebuilds/linux-${arch}/${file}`)
    .filter((filePath) => !files.includes(filePath)));
  if (missingFromPackage.length) {
    stderr.write(
      `Native prebuilds are not included in the npm package:\n${missingFromPackage.map((file) => ` - ${file}`).join('\n')}\n`,
    );
    return false;
  }

  process.stdout.write('Native prebuilds for Linux x64 and ARM64 are included in the npm package.\n');
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!verifyNativePrebuildPackage()) process.exitCode = 1;
}
