import type { Computed } from "./types";

export function computed<T>(_fn: () => T): Computed<T> {
  throw new Error("Not implemented yet");
}
