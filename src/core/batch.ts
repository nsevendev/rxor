import { endBatch, startBatch } from "./graph";

export function batch(fn: () => void): void {
  startBatch();
  try {
    fn();
  } finally {
    endBatch();
  }
}
