export function createBackendService(services) {
  async function request(path, options = {}) {
    const response = await fetch(path, {
      cache: 'no-store',
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response;
  }

  async function requestJson(path, options = {}) {
    const response = await request(path, options);
    return response.json();
  }

  return {
    request,
    requestJson,
    async getClientConfig() {
      return requestJson('/api/admin/configs');
    },
    async createConfigSubscription(scope = 'config') {
      return requestJson('/api/admin/subs/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({scope}),
      });
    },
    createEventSource(eventsUrl) {
      return new EventSource(eventsUrl);
    },
    async deleteSubscription(id) {
      const encodedId = encodeURIComponent(String(id || ''));
      return fetch(`/api/admin/subs/${encodedId}`, {
        method: 'DELETE',
        keepalive: true,
      });
    },
    async getAvailableRemotes() {
      return requestJson('/api/admin/remotes');
    },
    async getAvailableBrowsers() {
      return requestJson('/api/admin/remotes/browsers');
    },
    async getSamsungStatus() {
      return requestJson('/api/remotes/samsung/status');
    },
  };
}
