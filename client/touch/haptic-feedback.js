const TOUCH_CONTROLS_SELECTOR = [
    'button:not(:disabled)',
    'a[href]',
    '[role="button"]',
    'input[type="button"]:not(:disabled)',
    'input[type="submit"]:not(:disabled)',
    'input[type="range"]',
].join(', ');

export function triggerHapticFeedback(navigatorRef = globalThis.navigator, durationMs = 10) {
    if (typeof navigatorRef?.vibrate !== 'function') {
        return false;
    }

    try {
        return navigatorRef.vibrate(durationMs) !== false;
    } catch (_error) {
        // Haptics are optional; a browser or device may expose but reject the API.
        return false;
    }
}

export function bindTouchHapticFeedback(root = document, {navigatorRef = globalThis.navigator} = {}) {
    const onTouchStart = (event) => {
        const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
        const control = target?.closest?.(TOUCH_CONTROLS_SELECTOR);
        if (!control || control.getAttribute?.('aria-disabled') === 'true') {
            return;
        }

        triggerHapticFeedback(navigatorRef);
    };

    root.addEventListener('touchstart', onTouchStart, {capture: true, passive: true});
    return () => root.removeEventListener('touchstart', onTouchStart, {capture: true});
}
