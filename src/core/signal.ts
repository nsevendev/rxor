import { SignalNode, untracked } from "./graph";
import type { Signal } from "./types";

export function signal<T>(initial: T): Signal<T> {
  const node = new SignalNode(initial);

  const sig: Signal<T> = {
    get value(): T {
      return node._read();
    },
    set value(next: T) {
      node._write(next);
    },
    peek(): T {
      return untracked(() => node._value);
    },
    subscribe(callback: (value: T) => void): () => void {
      return node._subscribe(() => callback(node._value));
    },
  };

  return sig;
}
