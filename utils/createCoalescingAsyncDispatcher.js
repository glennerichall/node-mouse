export function createCoalescingAsyncDispatcher({
  normalize,
  canMerge,
  merge,
  consume,
  onError = () => {},
}) {
  let pending = null;
  let processing = false;

  async function drain() {
    if (processing) return;
    processing = true;
    try {
      while (pending !== null) {
        const contribution = pending;
        pending = null;
        try {
          await consume(contribution);
        } catch (error) {
          onError(error, contribution);
        }
      }
    } finally {
      processing = false;
      if (pending !== null) void drain();
    }
  }

  return function contribute(value) {
    const contribution = normalize(value);
    pending = pending !== null && canMerge(pending, contribution)
      ? merge(pending, contribution)
      : contribution;
    void drain();
  };
}
