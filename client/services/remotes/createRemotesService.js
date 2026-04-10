export function createRemotesService(services) {
  const {getBackend, getTransport, getPubSub} = services;
  return {
    emit(eventName, payload = {}) {
      getTransport().emitWithTimestamp(eventName, payload);
    },
    async loadAvailableRemotes() {
      const payload = await getBackend().getAvailableRemotes();
      const remotes = Array.isArray(payload?.remotes) ? payload.remotes : [];
      getPubSub().publish('remotes.available.changed', {remotes});
      return remotes;
    },
    async loadAvailableBrowsers() {
      const payload = await getBackend().getAvailableBrowsers();
      const browsers = Array.isArray(payload?.browsers) ? payload.browsers : [];
      getPubSub().publish('remotes.browsers.changed', {browsers});
      return browsers;
    },
  };
}
