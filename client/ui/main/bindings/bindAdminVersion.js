export async function bindAdminVersion(services, dom) {
  const versionNode = dom.remotes.admin.adminAppVersion;
  const i18n = services.getI18n();

  if (!versionNode) {
    return;
  }

  async function refreshVersion() {
    const {t} = i18n.getI18n();

    try {
      const response = await fetch('/health', { cache: 'no-store' });
      const payload = await response.json();
      const version = String(payload?.version || '').trim() || t('common.unknown');
      versionNode.textContent = t('main.adminAppVersion').replace('--', version);
    } catch (_error) {
      versionNode.textContent = t('main.adminAppVersion').replace('--', t('common.unknown'));
    }
  }

  i18n.onChange(() => {
    void refreshVersion();
  });

  await refreshVersion();
}
