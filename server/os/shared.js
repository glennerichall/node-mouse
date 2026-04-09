export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function findFirstAvailable(items = [], tester = async () => false) {
  for (const item of items) {
    if (await tester(item)) {
      return item;
    }
  }
  return '';
}
