import { SignalNode, endBatch, notify, startBatch } from "./graph";

const proxyCache = new WeakMap<object, object>();
const propertyNodes = new WeakMap<object, Map<string | symbol, SignalNode<unknown>>>();
const parentSignal = new WeakMap<object, SignalNode<unknown>>();

function getPropertyNode(target: object, key: string | symbol): SignalNode<unknown> {
  let nodes = propertyNodes.get(target);
  if (!nodes) {
    nodes = new Map();
    propertyNodes.set(target, nodes);
  }
  let node = nodes.get(key);
  if (!node) {
    node = new SignalNode(undefined);
    nodes.set(key, node);
  }
  return node;
}

function notifyPropertyChange(target: object, key: string | symbol): void {
  startBatch();
  const nodes = propertyNodes.get(target);
  const node = nodes?.get(key);
  if (node) {
    node._version++;
    notify(node._subscribers);
  }
  endBatch();
}

function notifyCollectionChange(target: object): void {
  startBatch();
  const nodes = propertyNodes.get(target);
  if (nodes) {
    for (const node of nodes.values()) {
      node._version++;
      notify(node._subscribers);
    }
  }
  endBatch();
}

function isPlainObject(value: unknown): value is Record<string | symbol, unknown> {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function shouldProxy(value: unknown): value is object {
  if (value === null || typeof value !== "object") return false;
  if (value instanceof Map || value instanceof Set) return true;
  if (Array.isArray(value)) return true;
  return isPlainObject(value);
}

const ARRAY_MUTATING_METHODS = new Set([
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "fill",
  "copyWithin",
]);

export function createDeepProxy<T extends object>(target: T, ownerSignal: SignalNode<unknown>): T {
  const cached = proxyCache.get(target);
  if (cached) return cached as T;

  if (target instanceof Map) {
    return createMapProxy(target as unknown as Map<unknown, unknown>, ownerSignal) as unknown as T;
  }
  if (target instanceof Set) {
    return createSetProxy(target as unknown as Set<unknown>, ownerSignal) as unknown as T;
  }

  parentSignal.set(target, ownerSignal);

  const proxy = new Proxy(target, {
    get(obj, prop, receiver) {
      const propNode = getPropertyNode(obj, prop);
      propNode._read();

      const value = Reflect.get(obj, prop, receiver);

      if (Array.isArray(obj) && typeof prop === "string" && ARRAY_MUTATING_METHODS.has(prop)) {
        return function (this: unknown, ...args: unknown[]) {
          const result = (value as (...a: unknown[]) => unknown).apply(obj, args);
          notifyPropertyChange(obj, "length");
          return result;
        };
      }

      if (shouldProxy(value)) {
        return createDeepProxy(value, ownerSignal);
      }

      return value;
    },

    set(obj, prop, newValue, receiver) {
      const oldValue = Reflect.get(obj, prop, receiver);
      if (Object.is(oldValue, newValue)) return true;
      Reflect.set(obj, prop, newValue, receiver);
      notifyPropertyChange(obj, prop);
      return true;
    },

    deleteProperty(obj, prop) {
      const had = prop in obj;
      const result = Reflect.deleteProperty(obj, prop);
      if (had) {
        notifyPropertyChange(obj, prop);
      }
      return result;
    },
  });

  proxyCache.set(target, proxy);
  return proxy as T;
}

function createMapProxy(
  map: Map<unknown, unknown>,
  ownerSignal: SignalNode<unknown>,
): Map<unknown, unknown> {
  const cached = proxyCache.get(map);
  if (cached) return cached as Map<unknown, unknown>;

  parentSignal.set(map, ownerSignal);

  const proxy = new Proxy(map, {
    get(target, prop, receiver) {
      if (typeof prop === "string" && (prop === "get" || prop === "has" || prop === "forEach")) {
        const propNode = getPropertyNode(target, prop);
        propNode._read();
      }
      if (prop === "size") {
        const propNode = getPropertyNode(target, "size");
        propNode._read();
        return target.size;
      }

      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;

      if (typeof prop === "string" && (prop === "set" || prop === "delete" || prop === "clear")) {
        return function (this: unknown, ...args: unknown[]) {
          const result = (value as (...a: unknown[]) => unknown).apply(target, args);
          notifyCollectionChange(target);
          return result;
        };
      }

      return (value as (...a: unknown[]) => unknown).bind(target);
    },
  });

  proxyCache.set(map, proxy);
  return proxy;
}

function createSetProxy(set: Set<unknown>, ownerSignal: SignalNode<unknown>): Set<unknown> {
  const cached = proxyCache.get(set);
  if (cached) return cached as Set<unknown>;

  parentSignal.set(set, ownerSignal);

  const proxy = new Proxy(set, {
    get(target, prop, receiver) {
      if (typeof prop === "string" && (prop === "has" || prop === "forEach")) {
        const propNode = getPropertyNode(target, prop);
        propNode._read();
      }
      if (prop === "size") {
        const propNode = getPropertyNode(target, "size");
        propNode._read();
        return target.size;
      }

      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== "function") return value;

      if (typeof prop === "string" && (prop === "add" || prop === "delete" || prop === "clear")) {
        return function (this: unknown, ...args: unknown[]) {
          const result = (value as (...a: unknown[]) => unknown).apply(target, args);
          notifyCollectionChange(target);
          return result;
        };
      }

      return (value as (...a: unknown[]) => unknown).bind(target);
    },
  });

  proxyCache.set(set, proxy);
  return proxy;
}
