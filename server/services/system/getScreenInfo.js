export function getScreenInfo(services) {
    try {
        const screen = services.getRobot().getScreenSize();
        if (!screen || !Number.isFinite(screen.width) || !Number.isFinite(screen.height)) {
            return null;
        }

        return {
            width: screen.width,
            height: screen.height,
        };
    } catch (_error) {
        return null;
    }
}