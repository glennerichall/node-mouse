const DEFAULT_CLIENT_CONFIG = {
  input: {
    touchDragHoldMs: 420,
    touchDragStillDistancePx: 8,
  },
};

let configState = structuredClone(DEFAULT_CLIENT_CONFIG);
let subscriptionId = '';
let configStream = null;
const listeners = new Set();

function getConfigObjectFromEntries(entries) {
  const config = {};

  for (const entry of entries || []) {
    if (!entry?.id) {
      continue;
    }

    setValueAtPath(config, entry.id, entry.value);
  }

  return config;
}

function setValueAtPath(target, path, value) {
  const segments = String(path || '').split('.').filter(Boolean);
  if (!segments.length) {
    return;
  }

  let cursor = target;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (typeof cursor[segment] !== 'object' || cursor[segment] === null) {
      cursor[segment] = {};
    }
    cursor = cursor[segment];
  }

  cursor[segments[segments.length - 1]] = value;
}

function applyConfigEntries(entries = []) {
  for (const entry of entries) {
    if (!entry?.path) {
      continue;
    }
    setValueAtPath(configState, entry.path, entry.value);
  }
  notifyListeners();
}

function notifyListeners() {
  for (const listener of listeners) {
    listener(configState);
  }
}

async function loadClientConfig() {
  const response = await fetch('/api/admin/configs', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Unable to load client config.');
  }

  const payload = await response.json();
  const loadedConfig = payload?.config || getConfigObjectFromEntries(payload?.configs);
  configState = {
    ...structuredClone(DEFAULT_CLIENT_CONFIG),
    ...loadedConfig,
  };
  notifyListeners();
}

async function subscribeToConfigEvents() {
  if (typeof window.EventSource !== 'function') {
    return;
  }

  const response = await fetch('/api/admin/subs/configs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ scope: 'config' }),
  });

  if (!response.ok) {
    return;
  }

  const payload = await response.json();
  subscriptionId = String(payload.id || '');
  if (!subscriptionId || !payload.eventsUrl) {
    return;
  }

  configStream?.close();
  configStream = new EventSource(payload.eventsUrl);
  configStream.addEventListener('config.changed', (event) => {
    try {
      const data = JSON.parse(event.data || '{}');
      applyConfigEntries(data.entries);
    } catch (_error) {
    }
  });
}

function unsubscribeFromConfigEvents() {
  if (!subscriptionId) {
    return;
  }

  fetch(`/api/admin/subs/${encodeURIComponent(subscriptionId)}`, {
    method: 'DELETE',
    keepalive: true,
  }).catch(() => {});

  configStream?.close();
  configStream = null;
  subscriptionId = '';
}

export async function initClientConfig() {
  try {
    await loadClientConfig();
  } catch (_error) {
    configState = structuredClone(DEFAULT_CLIENT_CONFIG);
  }

  await subscribeToConfigEvents();
  window.addEventListener('beforeunload', unsubscribeFromConfigEvents, { once: true });
}

export function getClientInputConfig() {
  return configState.input || DEFAULT_CLIENT_CONFIG.input;
}

export function getClientSamsungConfig() {
  return configState.samsungTv || {};
}

export function onClientConfigChange(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }

  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
