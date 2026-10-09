export function createDeviceSessionsPanel({
  listNode,
  statusNode,
  reloadButton,
  revokeAllButton,
  fetchImpl = fetch,
  documentRef = document,
  locale = 'fr',
  t,
  confirm = window.confirm.bind(window),
}) {
  let sessions = [];

  function setStatus(message, tone = '') {
    statusNode.textContent = message;
    statusNode.className = tone ? `status-${tone}` : '';
  }

  function createTextNode(tagName, className, text) {
    const node = documentRef.createElement(tagName);
    if (className) {
      node.className = className;
    }
    node.textContent = text;
    return node;
  }

  function getSessionName(session) {
    return String(session.deviceName || session.clientAddress || t('adminConfig.devices.unnamed'));
  }

  function render() {
    listNode.replaceChildren();
    revokeAllButton.disabled = !sessions.some((session) => session.state !== 'revoked' && !session.isCurrent);
    if (sessions.length === 0) {
      listNode.append(createTextNode('li', 'device-sessions-empty', t('adminConfig.devices.empty')));
      return;
    }

    for (const session of sessions) {
      const item = documentRef.createElement('li');
      item.className = `device-session device-session-${session.state || 'unknown'}`;
      const details = documentRef.createElement('div');
      details.className = 'device-session-details';
      const name = getSessionName(session);
      const role = t(`adminConfig.devices.role.${session.role || 'controller'}`);
      const state = t(`adminConfig.devices.state.${session.state || 'unknown'}`);
      const lastActivityAt = Number(session.lastActivityAt);
      const lastActivity = Number.isFinite(lastActivityAt) && lastActivityAt > 0
        ? new Intl.DateTimeFormat(locale, {dateStyle: 'medium', timeStyle: 'short'}).format(lastActivityAt)
        : t('adminConfig.devices.unknownActivity');

      details.append(
        createTextNode('h3', 'device-session-name', name),
        createTextNode('p', 'device-session-meta', t('adminConfig.devices.meta', {role, state})),
        createTextNode('p', 'device-session-activity', t('adminConfig.devices.lastActivity', {value: lastActivity})),
      );
      item.append(details);

      if (session.state === 'active' && !session.isCurrent) {
        const revokeButton = createTextNode('button', 'device-session-revoke', t('adminConfig.devices.revoke'));
        revokeButton.type = 'button';
        revokeButton.addEventListener('click', () => revokeSession(session.id, name, revokeButton));
        item.append(revokeButton);
      } else if (session.isCurrent) {
        item.append(createTextNode('span', 'device-session-current', t('adminConfig.devices.current')));
      }

      listNode.append(item);
    }
  }

  async function load({silent = false} = {}) {
    reloadButton.disabled = true;
    if (!silent) {
      setStatus(t('adminConfig.devices.loading'), 'pending');
    }

    try {
      const response = await fetchImpl('/api/admin/sessions', {cache: 'no-store'});
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || t('adminConfig.devices.loadError'));
      }
      sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
      render();
      setStatus(t('adminConfig.devices.loaded'), 'success');
      return true;
    } catch (error) {
      setStatus(error.message || t('adminConfig.devices.loadError'), 'error');
      return false;
    } finally {
      reloadButton.disabled = false;
    }
  }

  async function revokeSession(sessionId, name, button) {
    if (!confirm(t('adminConfig.devices.confirmRevoke', {name}))) {
      return;
    }
    button.disabled = true;
    setStatus(t('adminConfig.devices.revoking', {name}), 'pending');
    try {
      const response = await fetchImpl(`/api/admin/sessions/${encodeURIComponent(sessionId)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message || t('adminConfig.devices.revokeError'));
      }
      const refreshed = await load({silent: true});
      if (refreshed) {
        setStatus(t('adminConfig.devices.revoked', {name}), 'success');
      }
    } catch (error) {
      setStatus(error.message || t('adminConfig.devices.revokeError'), 'error');
      button.disabled = false;
    }
  }

  async function revokeAllSessions() {
    const count = sessions.filter((session) => session.state !== 'revoked' && !session.isCurrent).length;
    if (count === 0 || !confirm(t('adminConfig.devices.confirmRevokeAll', {count}))) {
      return;
    }

    revokeAllButton.disabled = true;
    setStatus(t('adminConfig.devices.revokingAll', {count}), 'pending');
    try {
      const response = await fetchImpl('/api/admin/sessions', {method: 'DELETE'});
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || t('adminConfig.devices.revokeAllError'));
      }

      const refreshed = await load({silent: true});
      if (refreshed) {
        setStatus(t('adminConfig.devices.revokedAll', {count: payload.revokedCount}), 'success');
      }
    } catch (error) {
      setStatus(error.message || t('adminConfig.devices.revokeAllError'), 'error');
      revokeAllButton.disabled = false;
    }
  }

  reloadButton.addEventListener('click', () => load());
  revokeAllButton.addEventListener('click', revokeAllSessions);

  return {
    load,
    refreshTranslations(nextLocale = locale) {
      locale = nextLocale;
      render();
    },
  };
}
