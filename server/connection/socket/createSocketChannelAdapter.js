import {assertEventChannel} from '../../services/transport/event-channel.js';
import {createEventCallbackChain} from '../../services/transport/createEventCallbackChain.js';

/**
 * Adapts Socket.IO's listener signature to the transport-neutral channel
 * contract used by subscribers. Socket.IO supplies `(payload, ack)` to the
 * native listener; the adapter exposes that pair as `(payload, response)` and
 * delegates middleware chaining to the transport-neutral helper.
 */
export function createSocketChannelAdapter(socket) {
  const channel = {
    id: socket.id,
    securityContext: socket.securityContext,
    on(eventName, callbackChainFirst, ...callbacksChain) {
      const callbacks = [callbackChainFirst, ...callbacksChain];
      if (callbacks.some((callback) => typeof callback !== 'function')) {
        throw new TypeError('A channel callback chain must contain functions.');
      }

      const listener = createEventCallbackChain(
        callbacks,
        (error) => socket.emit('error', error),
      );

      socket.on(eventName, (payload, response) => listener(payload ?? {}, response));
      return channel;
    },
    emit(eventName, payload) {
      socket.emit(eventName, payload);
      return channel;
    },
  };

  return assertEventChannel(channel);
}
