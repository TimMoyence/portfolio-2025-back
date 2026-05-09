/** Vide la file des promesses resolues via setImmediate (microtask + macrotask). */
export function flushPromises(): Promise<void> {
  return new Promise<void>((resolve) => setImmediate(resolve));
}
