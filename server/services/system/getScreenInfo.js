import {resolveLinuxScreenSize} from '../../os/linux/screen.js';

function normalizeScreenInfo(screen) {
    const width = Number(screen?.width);
    const height = Number(screen?.height);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return null;
    }

    return {
        width: Math.round(width),
        height: Math.round(height),
    };
}

export async function getScreenInfo(services) {
    try {
        if (services.getOs?.().platform === 'linux') {
            const linuxScreen = await resolveLinuxScreenSize();
            if (linuxScreen) {
                return linuxScreen;
            }
        }
    } catch (_error) {}

    try {
        const screen = services.getRobot().getScreenSize();
        return normalizeScreenInfo(screen);
    } catch (_error) {
        return null;
    }
}
