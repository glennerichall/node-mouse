const lifecycleState = new WeakMap();

export function ensureApplicationLifecycleState(services) {
  let state = lifecycleState.get(services);
  if (!state) {
    state = {
      cliServer: null,
      shuttingDown: false,
      stopConfigObserver: () => {},
      stopNotificationObserver: () => {},
      stopQrOverlayRefreshObserver: () => {},
      shutdown: null,
    };
    lifecycleState.set(services, state);
  }
  return state;
}
