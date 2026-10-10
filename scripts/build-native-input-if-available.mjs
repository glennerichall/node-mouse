import {existsSync} from 'node:fs';
import process from 'node:process';
import {fileURLToPath} from 'node:url';
import {
  getLinuxNativePrebuildPath,
  LINUX_NATIVE_COMPONENTS,
} from '../server/os/linux/nativeArtifactPaths.js';
import {configureUInputAfterAppUpdate} from './configure-uinput-after-update.mjs';

const REQUIRED_COMPONENTS = ['uinput', 'xwaylandPointer', 'xwaylandOverlay'];

/**
 * Keep npm installation free of native compilation. Developers can invoke
 * the explicit build scripts; published packages must carry their binaries.
 */
export function buildNativeInputIfAvailable({
  platform = process.platform,
  arch = process.arch,
  exists = existsSync,
  stderr = process.stderr,
  migrateUInput = configureUInputAfterAppUpdate,
} = {}) {
  if (platform !== 'linux') {
    return {built: [], skipped: LINUX_NATIVE_COMPONENTS};
  }

  const prebuiltAvailable = Object.fromEntries(
    LINUX_NATIVE_COMPONENTS.map((name) => [
      name,
      exists(getLinuxNativePrebuildPath(name, {arch})),
    ]),
  );
  const unavailable = LINUX_NATIVE_COMPONENTS.filter((name) => !prebuiltAvailable[name]);
  const unavailableRequired = REQUIRED_COMPONENTS.filter((name) => !prebuiltAvailable[name]);
  if (unavailableRequired.length) {
    stderr.write(
      `Required native components not packaged for Linux ${arch}: ${unavailableRequired.join(', ')}. npm install did not compile them; build artifacts on a development host before publishing.\n`,
    );
  }

  migrateUInput();
  return {built: [], skipped: unavailable};
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildNativeInputIfAvailable();
}
