import {createApplicationStart} from './start.js';
import {createApplicationShutdown} from './shutdown.js';
import {ensureApplicationLifecycleState} from './state.js';

export function createApplicationLifecycle(services) {
    const state = ensureApplicationLifecycleState(services);
    const shutdown = createApplicationShutdown(services);
    state.shutdown = shutdown;
    const start = createApplicationStart(services);

    return {
        start,
        shutdown,
    };
}
