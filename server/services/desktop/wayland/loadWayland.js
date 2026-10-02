import {loadUInput} from './loadUInput.js';
import {loadWaylandPortal} from './loadWaylandPortal.js';

export async function loadWayland({
                                      strategy = process.env.REMOTE_MOUSE_WAYLAND_INPUT || 'uinput',
                                      uinputLoader = loadUInput,
                                      portalLoader = loadWaylandPortal,
                                  } = {}) {
    const normalizedStrategy = String(strategy).trim().toLowerCase();
    if (normalizedStrategy === 'uinput') {
        return uinputLoader();
    }
    if (normalizedStrategy === 'portal') {
        return portalLoader();
    }
    throw new Error(`Unknown Wayland input strategy: ${strategy}. Expected uinput or portal.`);
}
