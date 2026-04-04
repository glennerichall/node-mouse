export function formatSseMessage(event = {}) {
    const eventName = String(event.name || event.type || 'message').trim() || 'message';
    const payload = event.payload === undefined ? {} : event.payload;
    return `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export function createExactMatchPredicate(filters = {}) {
    const entries = Object.entries(filters);
    if (!entries.length) {
        return () => true;
    }

    return (event) => entries.every(([key, value]) => event?.[key] === value);
}