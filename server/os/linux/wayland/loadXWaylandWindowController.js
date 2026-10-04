import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const DEFAULT_BRIDGE_PATH = new URL(
  '../../../../build/wayland/remote-mouse-xwayland-window.node',
  import.meta.url,
).pathname;

export function loadXWaylandWindowController({
  bridgePath = DEFAULT_BRIDGE_PATH,
  loadNative = require,
} = {}) {
  try {
    return loadNative(bridgePath);
  } catch (_error) {
    return {setVisible: () => false};
  }
}
