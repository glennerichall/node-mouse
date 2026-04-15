export function disableReentrancy(callback, lock = {}) {
    lock.reentrant = false;
    return (...args) => {
        if (!lock.reentrant) {
            lock.reentrant = true;
            try {
                return callback(...args);
            } finally {
                lock.reentrant = false;
            }
        }
        return undefined;
    };
}

export function createReentrancyDisabler(callback) {
    const lock = {};
    return callback => disableReentrancy(callback, lock);
}

export function disableConcurrentCalls(...functions) {
    const lock = {};
    return functions.map(fun => disableReentrancy(fun, lock));
}

export function createQueuedRecompute(recompute) {
    let running = false;
    let pending = false;

    return (...args) => {
        if (running) {
            pending = true;
            return undefined;
        }

        running = true;
        try {
            let result;
            do {
                pending = false;
                result = recompute(...args);
            } while (pending);
            return result;
        } finally {
            running = false;
        }
    };
}
