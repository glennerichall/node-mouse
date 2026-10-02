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
  return `REMOTE_MOUSE_DAEMON=1 npm update -g ${shellQuote(name)}`;
}
