export function createNoopOverlay() {
  return {
    close: () => {},
    show: async () => false,
    hide: async () => false,
    update: async () => {},
    setSuppressed: () => false,
    toggle: async () => false,
    isVisible: () => false,
    isSuppressed: () => false,
    getBounds: () => null,
  };
}
