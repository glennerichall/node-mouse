export function notify(notifier, target, payload, options = {}) {
    if (!payload?.message) {
        return;
    }

    notifier.target(target).notify(payload, options);
}