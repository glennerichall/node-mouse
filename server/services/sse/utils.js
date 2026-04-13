export {createExactMatchPredicate} from '../../../utils/predicates.js';

export function formatSseMessage(event = {}) {
    const eventName = String(event.name || event.type || 'message').trim() || 'message';
    const payload = event.payload === undefined ? {} : event.payload;
    return `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
}
