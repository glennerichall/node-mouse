import {createRequire} from 'node:module';
import {getLinuxNativeArtifactPath} from '../nativeArtifactPaths.js';

const require = createRequire(import.meta.url);
const DEFAULT_BRIDGE_PATH = getLinuxNativeArtifactPath('uinput');

export function loadUInputBridge({
                                     bridgePath = process.env.REMOTE_MOUSE_UINPUT_BRIDGE || DEFAULT_BRIDGE_PATH,
                                     loadNative = require,
                                 } = {}) {
    try {
        return loadNative(bridgePath);
    } catch (cause) {
        const error = new Error(`uinput bridge not loadable at ${bridgePath}. Run npm run build:uinput.`, {cause});
        error.code = 'UINPUT_BRIDGE_MISSING';
        throw error;
    }
}
