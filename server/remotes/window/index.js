export function createWindowActions(osService) {
  return {
    toggleMaximizeMinimize: () => osService.window.toggleActive(),
    closeActiveWindow: () => osService.window.closeActive(),
  };
}
