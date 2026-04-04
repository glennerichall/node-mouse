import {getClientI18n, onClientI18nChange} from '../i18n/index.js';

export async function bindAdminVersion(versionNode) {
  if (!versionNode) {
    return;
  }

  async function refreshVersion() {
    const {t} = getClientI18n();

    try {
      const response = await fetch('/health', { cache: 'no-store' });
      const payload = await response.json();
      const version = String(payload?.version || '').trim() || t('common.unknown');
      versionNode.textContent = t('main.adminAppVersion').replace('--', version);
    } catch (_error) {
      versionNode.textContent = t('main.adminAppVersion').replace('--', t('common.unknown'));
    }
  }

  onClientI18nChange(() => {
    void refreshVersion();
  });

  await refreshVersion();
}
