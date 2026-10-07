/**
 * Contract shared by Socket.IO and future transport adapters.
 * Subscribers may register listeners and emit protocol responses, but do not
 * need to know which transport implementation owns the channel.
 */
export function assertEventChannel(channel) {
  if (!channel || typeof channel.on !== 'function' || typeof channel.emit !== 'function') {
    throw new TypeError('An event channel must expose on(eventName, handler) and emit(eventName, payload).');
  }
  return channel;
}
