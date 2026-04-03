export function createStore<T extends Record<string, unknown>>(definition: T): T {
  return definition;
}
