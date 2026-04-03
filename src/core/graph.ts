// ============================================================
// Reactive dependency graph — the heart of rxor
// ============================================================
//
// How it works:
// 1. When a computed/effect runs, it pushes itself onto `trackingStack`
// 2. When a signal's `.value` is read, it checks the stack and registers the reader as a subscriber
// 3. When a signal's `.value` is written, it notifies all subscribers
// 4. Computed values are lazy: they only recompute when `.value` is read AND they are dirty
// 5. batch() defers all notifications until the batch ends

// --- Subscriber tracking ---

export type Subscriber = {
  _notify(): void;
  _sources: Set<SignalNode<unknown>>;
};

const trackingStack: (Subscriber | null)[] = [];

export function startTracking(subscriber: Subscriber): void {
  trackingStack.push(subscriber);
}

export function endTracking(_subscriber: Subscriber): void {
  trackingStack.pop();
}

export function getCurrentSubscriber(): Subscriber | null {
  return trackingStack.length > 0 ? (trackingStack[trackingStack.length - 1] ?? null) : null;
}

// Temporarily disable tracking (for peek / untracked)
export function untracked<T>(fn: () => T): T {
  trackingStack.push(null);
  try {
    return fn();
  } finally {
    trackingStack.pop();
  }
}

// --- Batching ---

let batchDepth = 0;
let pendingNotifications: Set<Subscriber> = new Set();

export function startBatch(): void {
  batchDepth++;
}

let flushing = false;

export function endBatch(): void {
  batchDepth--;
  if (batchDepth === 0 && !flushing) {
    flushing = true;
    while (pendingNotifications.size > 0) {
      const pending = pendingNotifications;
      pendingNotifications = new Set();
      for (const subscriber of pending) {
        subscriber._notify();
      }
    }
    flushing = false;
  }
}

export function notify(subscribers: Set<Subscriber>): void {
  for (const subscriber of subscribers) {
    if (batchDepth > 0 || flushing) {
      pendingNotifications.add(subscriber);
    } else {
      subscriber._notify();
    }
  }
}

// --- Signal Node (internal, used by signal.ts) ---

export class SignalNode<T> {
  _value: T;
  _version = 0;
  _subscribers: Set<Subscriber> = new Set();

  constructor(initial: T) {
    this._value = initial;
  }

  _read(): T {
    const current = getCurrentSubscriber();
    if (current) {
      this._subscribers.add(current);
      current._sources.add(this);
    }
    return this._value;
  }

  _write(next: T): void {
    if (Object.is(this._value, next)) return;
    this._value = next;
    this._version++;
    startBatch();
    notify(this._subscribers);
    endBatch();
  }

  _subscribe(callback: () => void): () => void {
    const subscriber: Subscriber = {
      _notify: callback,
      _sources: new Set([this]),
    };
    this._subscribers.add(subscriber);
    return () => {
      this._subscribers.delete(subscriber);
    };
  }

  _removeSubscriber(subscriber: Subscriber): void {
    this._subscribers.delete(subscriber);
  }
}
