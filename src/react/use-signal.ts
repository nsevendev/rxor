import { useSyncExternalStore } from "react";
import type { ReadonlySignal } from "../core/types";

export function useSignal<T>(sig: ReadonlySignal<T>): T {
  return useSyncExternalStore(
    (onStoreChange) => sig.subscribe(() => onStoreChange()),
    () => sig.peek(),
    () => sig.peek(),
  );
}
