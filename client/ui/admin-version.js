export async function bindAdminVersion(versionNode) {
  if (!versionNode) {
    return;
  }

  try {
    const response = await fetch('/health', { cache: 'no-store' });
    const payload = await response.json();
    const version = String(payload?.version || '').trim() || 'unknown';
    versionNode.textContent = `Version: ${version}`;
  } catch (_error) {
    versionNode.textContent = 'Version: unknown';
  }
}
