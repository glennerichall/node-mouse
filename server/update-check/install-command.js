function shellQuote(value) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }
  return `'${text.replace(/'/g, `'\"'\"'`)}'`;
}

export function buildNpmGlobalUpdateCommand(packageName) {
  const name = String(packageName || '').trim();
  if (!name) {
    return '';
  }
  return `npm update -g ${shellQuote(name)} --force`;
}

export function buildGitUpdateCommand(remote, ref) {
  const safeRemote = String(remote || '').trim() || 'origin';
  const safeRef = String(ref || '').trim() || 'HEAD';
  return `git fetch ${shellQuote(safeRemote)} ${shellQuote(safeRef)} && git merge --ff-only FETCH_HEAD`;
}
