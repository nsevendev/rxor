import type { ReadonlySignal } from "../core/types";
import { useSignal } from "../react/use-signal";

export function useStore<S extends Record<string, unknown>, R>(
  store: S,
  selector: (store: S) => ReadonlySignal<R>,
): R {
  const sig = selector(store);
  return useSignal(sig);
}
