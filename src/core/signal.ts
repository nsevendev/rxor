import { SignalNode, untracked } from "./graph";
import { createDeepProxy } from "./proxy";
import type { Signal } from "./types";

function shouldProxy(value: unknown): value is object {
  if (value === null || typeof value !== "object") return false;
  if (value instanceof Map || value instanceof Set) return true;
  if (Array.isArray(value)) return true;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function signal<T>(initial: T): Signal<T> {
  const node = new SignalNode(initial);

  function getProxied(): T {
    const raw = node._read();
    if (shouldProxy(raw)) {
      return createDeepProxy(raw as object, node) as T;
    }
    return raw;
  }

  const sig: Signal<T> = {
    get value(): T {
      return getProxied();
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
