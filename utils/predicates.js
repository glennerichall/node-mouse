export function createExactMatchPredicate(filters = {}) {
  const entries = Object.entries(filters);
  if (!entries.length) {
    return () => true;
  }

  return (value) => entries.every(([key, expected]) => value?.[key] === expected);
}
