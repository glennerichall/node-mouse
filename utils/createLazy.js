export function createLazy(provider) {
  let hasValue = false;
  let value;

  return () => {
    if (!hasValue) {
      value = provider();
      hasValue = true;
    }

    return value;
  };
}
