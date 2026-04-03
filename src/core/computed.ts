import {
  type SignalNode,
  type Subscriber,
  endTracking,
  getCurrentSubscriber,
  notify,
  startTracking,
  untracked,
} from "./graph";
import type { Computed } from "./types";

export function computed<T>(fn: () => T): Computed<T> {
  let cachedValue: T;
  let dirty = true;
  let initialized = false;
  let sources: Set<SignalNode<unknown>> = new Set();
  const subscribers: Set<Subscriber> = new Set();

  const subscriber: Subscriber = {
    _notify() {
      if (!dirty) {
        dirty = true;
        notify(subscribers);
      }
    },
    _sources: new Set(),
  };

  function compute(): T {
    for (const source of sources) {
      source._removeSubscriber(subscriber);
    }
    subscriber._sources = new Set();

    startTracking(subscriber);
    try {
      cachedValue = fn();
    } finally {
      endTracking(subscriber);
    }

    sources = subscriber._sources;
    dirty = false;
    initialized = true;
    return cachedValue;
  }

  const selfNode: SignalNode<unknown> = {
    _value: undefined,
    _version: 0,
    _subscribers: subscribers,
    _read() {
      return comp.value;
    },
    _write() {
      throw new Error("Cannot set value of a computed signal");
    },
    _subscribe(callback: () => void) {
      const sub: Subscriber = {
        _notify: callback,
        _sources: new Set(),
      };
      subscribers.add(sub);
      return () => subscribers.delete(sub);
    },
    _removeSubscriber(sub: Subscriber) {
      subscribers.delete(sub);
    },
  } as SignalNode<unknown>;

  const comp: Computed<T> = {
    get value(): T {
      if (dirty || !initialized) {
        compute();
      }
      const current = getCurrentSubscriber();
      if (current) {
        subscribers.add(current);
        current._sources.add(selfNode);
      }
      return cachedValue;
    },
    set value(_: T) {
      throw new Error("Cannot set value of a computed signal");
    },
    peek(): T {
      return untracked(() => {
        if (dirty || !initialized) {
          compute();
        }
        return cachedValue;
      });
    },
    subscribe(callback: (value: T) => void): () => void {
      if (dirty || !initialized) {
        compute();
      }
      const sub: Subscriber = {
        _notify() {
          const oldValue = cachedValue;
          if (dirty) {
            compute();
          }
          if (!Object.is(oldValue, cachedValue)) {
            callback(cachedValue);
          }
        },
        _sources: new Set(),
      };
      subscribers.add(sub);
      return () => {
        subscribers.delete(sub);
      };
    },
  };

  return comp;
}
