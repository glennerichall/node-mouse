const DEFAULT_DISPLAY_SIZE_POLL_MS = 1000;

function hasDisplaySizeChanged(previous, next) {
    return Boolean(previous && next && (previous.width !== next.width || previous.height !== next.height));
}

export function startDisplaySizeObserver(services, options = {}) {
    const intervalMs = Math.max(250, Number(options.intervalMs) || DEFAULT_DISPLAY_SIZE_POLL_MS);
    const getScreenInfo = options.getScreenInfo || (() => services.getSystem?.()?.getScreenInfo?.() || null);
    let previousSize = null;
    let polling = false;

    async function poll() {
        if (polling) {
            return;
        }

        let nextSize = null;
        try {
            polling = true;
            nextSize = await getScreenInfo();
        } finally {
            polling = false;
        }
        if (!nextSize) {
            return;
        }

        const mouse = services.getInputController?.().mouse;
        if (!previousSize) {
            previousSize = nextSize;
            mouse?.setScreenSizeOverride?.(nextSize);
            return;
        }

        if (!hasDisplaySizeChanged(previousSize, nextSize)) {
            mouse?.setScreenSizeOverride?.(nextSize);
            return;
        }

        const changedFrom = previousSize;
        previousSize = nextSize;
        mouse?.remapToScreenSize?.(changedFrom, nextSize);
        void services.getQrOverlay?.()?.update?.();
    }

    void poll();
    const interval = setInterval(() => {
        void poll();
    }, intervalMs);

    interval.unref?.();

    return () => clearInterval(interval);
}
