import { type SignalNode, type Subscriber, endTracking, startTracking } from "./graph";

type CleanupFn = () => void;
type EffectFn = () => CleanupFn | undefined;

export function effect(fn: EffectFn): CleanupFn {
  let cleanup: CleanupFn | undefined;
  let sources: Set<SignalNode<unknown>> = new Set();
  let disposed = false;

  const subscriber: Subscriber = {
    _notify() {
      if (disposed) return;
      run();
    },
    _sources: new Set(),
  };

  function run(): void {
    // Run previous cleanup
    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }

    // Unsubscribe from old sources
    for (const source of sources) {
      source._removeSubscriber(subscriber);
    }
    subscriber._sources = new Set();

    // Track new dependencies
    startTracking(subscriber);
    try {
      cleanup = fn() ?? undefined;
    } finally {
      endTracking(subscriber);
    }
    sources = subscriber._sources;
  }

  // Run immediately
  run();

  // Return dispose function
  return () => {
    if (disposed) return;
    disposed = true;
    if (cleanup) {
      cleanup();
      cleanup = undefined;
    }
    for (const source of sources) {
      source._removeSubscriber(subscriber);
    }
    sources = new Set();
  };
}
