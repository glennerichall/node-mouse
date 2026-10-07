export function broadcast(...handlers) {
  return (...args) => handlers.flatMap(handler => handler).map(handler => handler(...args));
}
