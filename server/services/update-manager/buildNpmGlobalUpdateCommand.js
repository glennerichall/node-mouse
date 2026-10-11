const packageNamePattern = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;

function quoteForDisplay(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

// Keep the process environment separate from the command. Windows reaches the
// npm.cmd shim through cmd.exe; the package-name allowlist keeps that command
// segment free from shell metacharacters.
export function buildNpmGlobalUpdateCommand(packageName, {platform = process.platform} = {}) {
  const name = String(packageName || '').trim();
  if (!name || name.length > 214 || !packageNamePattern.test(name)) return null;

  const isWindows = platform === 'win32';
  const args = isWindows
    ? ['/d', '/s', '/c', `npm update -g ${name}`]
    : ['update', '-g', name];
  return {
    executable: isWindows ? 'cmd.exe' : 'npm',
    args,
    env: {REMOTE_MOUSE_DAEMON: '1'},
    shell: false,
    displayCommand: `npm update -g ${quoteForDisplay(name)} (REMOTE_MOUSE_DAEMON=1)`,
  };
}
