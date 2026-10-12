export function createNoopOverlay() {
  return {
    close: () => {},
    show: async () => false,
    hide: async () => false,
    update: async () => {},
    toggle: async () => false,
    isVisible: () => false,
  };
}
