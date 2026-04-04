export function notify(notifier, target, payload, options = {}) {
    if (!payload?.message && !payload?.messageKey) {
        return;
    }

    notifier.target(target).notify(payload, options);
}
