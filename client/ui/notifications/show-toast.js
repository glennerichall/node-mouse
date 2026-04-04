import {getClientI18n} from '../../i18n/index.js';

export function showToast(root, payload = {}) {
  if (!root) {
    return;
  }
  const {t} = getClientI18n();
  const params = payload.params && typeof payload.params === 'object' ? payload.params : {};

  const title = String(
    payload.titleKey
      ? t(payload.titleKey, params)
      : (payload.title || t('common.notification')),
  );
  const message = String(
    payload.messageKey
      ? t(payload.messageKey, params)
      : (payload.message || ''),
  ).trim();
  if (!message) {
    return;
  }

  const level = String(payload.level || 'info');
  const ttlMs = Number(payload.ttlMs) > 0 ? Number(payload.ttlMs) : 4500;

  const toast = document.createElement('article');
  toast.className = `toast ${level}`;

  const titleEl = document.createElement('p');
  titleEl.className = 'toast-title';
  titleEl.textContent = title;

  const msgEl = document.createElement('p');
  msgEl.className = 'toast-msg';
  msgEl.textContent = message;

  toast.appendChild(titleEl);
  toast.appendChild(msgEl);
  root.prepend(toast);

  while (root.children.length > 5) {
    root.removeChild(root.lastElementChild);
  }

  setTimeout(() => {
    if (toast.parentElement === root) {
      root.removeChild(toast);
    }
  }, ttlMs);
}
