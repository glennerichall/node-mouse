import { createVlcReceiverState } from './state.js';
import { VLC_APP_SPEC } from './spec.js';

export function createVlc(services) {
  const state = createVlcReceiverState();
  let availabilityPromise = null;
  const getOsService = () => services.getOs();

  function getAvailability() {
    if (!availabilityPromise) {
      availabilityPromise = (async () => {
        try {
          const resolved = await getOsService().app.resolve(VLC_APP_SPEC);
          return Boolean(resolved);
        } catch (_error) {
          return false;
        }
      })();
    }
    return availabilityPromise;
  }

  return {
    async focusOrLaunch() {
      if (state.inFlight) {
        return false;
      }
      state.inFlight = true;
      try {
        return getOsService().app.openOrFocus(VLC_APP_SPEC, { maximize: false });
      } finally {
        state.inFlight = false;
      }
    },
    toggleWindow: () => getOsService().app.toggleWindow(VLC_APP_SPEC),
    closeWindow: () => getOsService().app.closeWindow(VLC_APP_SPEC),
    isAvailable: getAvailability,
  };
}
