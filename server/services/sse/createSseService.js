import {
  createExactMatchPredicate,
  formatSseMessage
} from "./utils.js";

export function createSseService() {
  const subscriptions = new Map();
  let nextId = 1;

  function createSubscription({filters} = {}) {
    const id = `sub-${nextId++}`;
    subscriptions.set(id, {
      id,
      predicate: createExactMatchPredicate(filters || {}),
      pendingEvents: [],
      response: null,
    });
    return id;
  }

  function emit(event) {
    for (const subscription of subscriptions.values()) {
      if (!subscription.predicate(event)) {
        continue;
      }

      if (subscription.response) {
        subscription.response.write(formatSseMessage(event));
        continue;
      }

      subscription.pendingEvents.push(event);
      if (subscription.pendingEvents.length > 50) {
        subscription.pendingEvents.shift();
      }
    }
  }

  function connect(id, req, res) {
    const subscription = subscriptions.get(id);
    if (!subscription) {
      return false;
    }

    if (subscription.response && subscription.response !== res) {
      subscription.response.end();
    }

    subscription.response = res;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    res.write('retry: 3000\n\n');

    for (const event of subscription.pendingEvents) {
      res.write(formatSseMessage(event));
    }
    subscription.pendingEvents = [];

    req.on('close', () => {
      if (subscription.response === res) {
        subscription.response = null;
      }
      res.end();
    });

    return true;
  }

  function deleteSubscription(id) {
    const subscription = subscriptions.get(id);
    if (!subscription) {
      return false;
    }

    subscription.response?.end();
    subscriptions.delete(id);
    return true;
  }

  return {
    createSubscription,
    connect,
    deleteSubscription,
    emit,
  };
}
