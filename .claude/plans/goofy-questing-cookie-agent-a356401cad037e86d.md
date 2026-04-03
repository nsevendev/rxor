# rxor v2 -- Complete Rewrite Plan

## Current State Assessment

The existing codebase (~298 lines across 9 files) is a thin wrapper around RxJS BehaviorSubject with:
- `ReaXar<T>` -- BehaviorSubject wrapper with `.value` getter/setter, `.subscribe()`, `.pipe()`, `.computed()`
- `ReaXor<T>` -- wrapper around ReaXar that adds `reset()` and registers in a global string-keyed store
- `RxStore` / `RxService` -- global singleton registries using string keys (not type-safe)
- `useRea` / `useReaCompute` / `useRxStore` / `useRxFetch` -- React hooks using `useState`+`useEffect` (not concurrent-mode safe)
- CI: single GitHub Actions workflow for npm publish with auto-versioning
- Build: plain `tsc`
- No tests, no linting, no formatting

Everything will be deleted. The v2 is a ground-up rewrite with zero overlap.

---

## Decision Matrix: Answering the 8 Design Questions

### 1. Monorepo vs Single Package with Multiple Entry Points

**Decision: Single package with multiple entry points (package.json `exports` map)**

Rationale:
- The library is small (<3KB target). Splitting into 3 npm packages creates coordination overhead (cross-package versioning, publishing order, local linking during dev) with no real benefit at this scale.
- A single `rxor` package with `rxor/core`, `rxor/react`, `rxor/store` entry points gives the same tree-shaking guarantees with far less tooling complexity.
- pnpm workspaces can still be used later if the project grows (e.g., adding a Babel plugin package), but starting with a single package avoids premature complexity.
- Users install one package: `pnpm add rxor`. If they only import from `rxor/core`, they get zero React dependency.

### 2. Build Tool

**Decision: tsup**

Rationale:
- tsup wraps esbuild for speed, produces ESM + CJS dual output with a single config line, generates `.d.ts` via a rollup-dts plugin.
- Plain `tsc` cannot produce CJS from ESM source without hacks. Rollup is overkill for a library this small.
- tsup supports multiple entry points natively.
- tsup config is ~15 lines. Build time will be <1 second.

### 3. Linting/Formatting

**Decision: Biome**

Rationale:
- Single tool replaces ESLint + Prettier (fewer deps, faster execution, simpler config).
- Biome is TypeScript-native, fast (Rust-based), and has good TS support.
- For a greenfield project, Biome's opinionated defaults are fine.

### 4. Dependency Tracking System (The Reactive Graph)

**Decision: Push-based dependency graph with automatic tracking via a global tracking context**

This is the core of the library. The design follows the well-established pattern used by Vue 3, Solid, Preact Signals, and Angular Signals.

#### Core concepts:

**Subscriber** -- anything that can be notified (computed, effect)
**Signal node** -- holds a value and a Set of subscribers
**Tracking context** -- a global stack that records which signal is currently being read by which subscriber

#### Algorithm:

```
Global state:
  trackingStack: Subscriber[] = []    // stack, not single value (for nested computed)

signal.get():
  1. If trackingStack is non-empty, add currentSubscriber to this signal's subscriber set
  2. Return value

signal.set(newValue):
  1. If Object.is(oldValue, newValue), return (distinctUntilChanged)
  2. Store newValue
  3. If inside batch, mark dirty and defer
  4. Otherwise, notify all subscribers (topological order for computed chains)

computed(fn):
  1. On first read (lazy): push self onto trackingStack, run fn, pop self
  2. Cache result; mark clean
  3. When a dependency signals a change, mark dirty (don't recompute yet -- lazy)
  4. On next read: if dirty, recompute (push/pop tracking again to refresh deps)

effect(fn):
  1. Immediately: push self onto trackingStack, run fn, pop self
  2. When a dependency signals a change, schedule re-run (microtask or sync depending on batch)
  3. Returns dispose function that removes self from all dependency subscriber sets

batch(fn):
  1. Set global batchDepth++
  2. Run fn
  3. batchDepth--
  4. If batchDepth === 0, flush all pending notifications
```

#### Why this design:
- **Push-based with lazy computed**: signals push "dirty" notifications, but computed values only recompute when read. This avoids unnecessary work.
- **Automatic cleanup of stale deps**: each time a computed or effect re-runs, it re-tracks from scratch. Dependencies no longer read are automatically dropped.
- **No global mutable singleton problem**: the tracking stack is module-scoped. Each test can import a fresh module instance if needed. For SSR, signals are per-request.

#### Data structures:

```typescript
interface SignalNode<T> {
  value: T;
  version: number;           // monotonically increasing, for cheap dirty checks
  subscribers: Set<Subscriber>;
}

interface Subscriber {
  dependencies: Set<SignalNode<any>>;
  execute(): void;
  dirty: boolean;
}
```

### 5. Minimal First Milestone

**Milestone 0 (Day 1):** Project scaffolding -- pnpm, tsup, vitest, biome, tsconfig, CI skeleton. No library code. Verify that `pnpm build`, `pnpm test`, `pnpm lint` all run.

**Milestone 1 (Week 1):** Primitive signals + computed + effect + batch -- the core reactive graph with primitive values only (no Proxy, no deep reactivity). Fully tested.

### 6. Order of Implementation

```
Phase 0: Scaffolding (1 day)
Phase 1: Core primitives -- signal, computed, effect, batch, untracked (1 week)
Phase 2: React bindings -- useSignal, useComputed (1 week)
Phase 3: Deep reactivity -- Proxy-based objects, arrays, Map, Set (1-2 weeks)
Phase 4: Store layer -- createStore, useStore (1 week)
Phase 5: SignalValue component for fine-grained rendering (2-3 days)
Phase 6: SSR support, React 19 compat testing (3-5 days)
Phase 7: Documentation, README, examples, npm publish pipeline (ongoing)
```

### 7. Proxy-Based Deep Reactivity

**Design: Lazy proxification with per-property signal nodes**

When `signal({ a: { b: 1 }, c: [2, 3] })` is called:
- The top-level object gets wrapped in a Proxy
- Each property access (`.a`, `.c`) returns a proxified child
- Proxy children are created lazily (only when accessed) and cached via a WeakMap
- Each leaf property has its own signal node, so updating `obj.a.b = 2` only notifies subscribers that read `obj.a.b`, not those that only read `obj.c`

For arrays: intercept mutating methods (`push`, `pop`, `splice`, `shift`, `unshift`, `sort`, `reverse`). Each mutation triggers appropriate signal updates. `.length` is a tracked property.

For Map/Set: wrap `.get()`, `.set()`, `.has()`, `.delete()`, `.forEach()`, `.size`. Each key in a Map gets its own signal node.

**Why lazy:** eagerly proxifying a deep object tree is wasteful. Most apps only read a subset of properties.

**WeakMap for proxy cache:** ensures the same object always returns the same proxy (referential stability) and allows GC of unreferenced branches.

### 8. Test Strategy

**Framework: vitest**

Test categories:

1. **Core unit tests** (no DOM, no React): signal get/set, computed derivation, effect execution/cleanup, batch coalescing, untracked reads, diamond dependency problem, circular dependency detection, GC of unused subscriptions.

2. **Deep reactivity tests**: Proxy behavior for objects, arrays, Map, Set. Nested property tracking. Array mutation interception. Edge cases.

3. **React hook tests** (using `@testing-library/react`): useSignal triggers re-render on signal change. useComputed memoizes correctly. useSyncExternalStore concurrent mode behavior. SSR. React 18 and 19 compat.

4. **Store integration tests**: createStore with signals + computed + actions. useStore with selectors. Type inference verification (using `expect-type`).

5. **Type tests** (using `expect-type`): verify TypeScript inference works correctly without manual annotations.

6. **Bundle size tests** (using `size-limit`): ensure gzipped core stays under 3KB.

---

## Detailed Phase Plan

### Phase 0: Project Scaffolding (Day 1)

Delete all existing source code. Keep `.git`, `.github` (will be modified), and `README.md` (will be rewritten later).

**Tasks:**

1. Install pnpm, run `pnpm init`
2. Create new `package.json` with:
   - `name: "rxor"`, `version: "2.0.0-alpha.0"`
   - `type: "module"`
   - `exports` map for `./core`, `./react`, `./store`
   - `peerDependencies: { "react": ">=18.0.0" }` with `peerDependenciesMeta.react.optional: true`
   - Zero `dependencies`
   - `devDependencies`: typescript, tsup, vitest, @testing-library/react, react, react-dom, jsdom, @biomejs/biome, expect-type, size-limit, @size-limit/preset-small-lib
   - Scripts: `build`, `test`, `test:watch`, `lint`, `lint:fix`, `format`, `typecheck`, `size`
3. Create `tsconfig.json`:
   - `target: "ES2022"`, `module: "ESNext"`, `moduleResolution: "bundler"`
   - `strict: true`, `exactOptionalPropertyTypes: true`, `noUncheckedIndexedAccess: true`
   - `jsx: "react-jsx"`, `declaration: true`
4. Create `tsup.config.ts`:
   - 3 entry points: `src/core/index.ts`, `src/react/index.ts`, `src/store/index.ts`
   - `format: ['esm', 'cjs']`, `dts: true`, `clean: true`, `treeshake: true`
5. Create `biome.json` with standard config
6. Create `vitest.config.ts` with `environment: 'jsdom'` for React tests
7. Create `.size-limit.json` targeting <3KB for core, <1.5KB for react, <1KB for store
8. Create empty entry point files: `src/core/index.ts`, `src/react/index.ts`, `src/store/index.ts`
9. Update `.gitignore`: add `dist/`, `coverage/`, `.turbo/`, `*.tsbuildinfo`
10. Create a placeholder test: `src/core/__tests__/signal.test.ts` with a single passing test
11. Verify: `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck` all pass

---

### Phase 1: Core Reactive Primitives (Week 1)

TDD throughout: write test, watch it fail, implement, watch it pass.

#### 1a. Signal (Days 1-2)

**Test file:** `src/core/__tests__/signal.test.ts`

Tests to write first:
- `signal(0)` returns object with `.value` getter returning 0
- `.value = 1` updates the value
- `.value` setter with same value (Object.is) does not notify
- signal with null, undefined, boolean, string, number, bigint, symbol
- `signal.peek()` reads value without tracking

**Implementation file:** `src/core/signal.ts`

Public API:
```typescript
export interface Signal<T> {
  readonly value: T;
  peek(): T;
}

export interface WritableSignal<T> extends Signal<T> {
  value: T;
}

export function signal<T>(initialValue: T): WritableSignal<T>
```

#### 1b. Reactive Graph / Tracking (Day 2)

**Test file:** `src/core/__tests__/graph.test.ts`

Tests:
- Reading a signal inside a tracking context adds the subscriber
- Reading a signal outside tracking context does not add subscriber
- Nested tracking contexts work correctly (stack behavior)
- Subscriber is notified when tracked signal changes

**Implementation file:** `src/core/graph.ts`

#### 1c. Computed (Days 3-4)

**Test file:** `src/core/__tests__/computed.test.ts`

Tests:
- `computed(() => a.value + b.value)` returns sum
- Recomputes when dependency changes
- Does NOT recompute when unrelated signal changes
- Lazy: does not compute until `.value` is read
- Caches result: reading `.value` twice without changes only computes once
- Diamond dependency: A -> B, A -> C, B+C -> D. Changing A recomputes D only once
- Dynamic dependencies: if condition changes which signals are read, old deps are dropped
- Computed of computed
- Throws if computed has circular dependency
- `.peek()` reads without tracking

**Implementation file:** `src/core/computed.ts`

#### 1d. Effect (Day 4)

**Test file:** `src/core/__tests__/effect.test.ts`

Tests:
- `effect(() => { ... })` runs immediately
- Re-runs when tracked signal changes
- Returns dispose function; after dispose, no longer runs
- Cleanup function returned from effect callback runs before re-execution and on dispose
- Dynamic dependency tracking
- Effect does not run during batch; runs after batch completes

**Implementation file:** `src/core/effect.ts`

#### 1e. Batch and Untracked (Day 5)

**Test file:** `src/core/__tests__/batch.test.ts`

Tests:
- `batch(() => { a.value = 1; b.value = 2; })` -- effect depending on both runs once
- Nested batch: inner batch does not flush
- `untracked(() => sig.value)` reads without creating dependency

**Implementation files:** `src/core/batch.ts`, `src/core/untracked.ts`

#### 1f. Public API (Day 5)

**File:** `src/core/index.ts` -- re-exports signal, computed, effect, batch, untracked

**Phase 1 exit criteria:** All core tests pass, build succeeds, lint passes, core bundle <2KB gzipped.

---

### Phase 2: React Bindings (Week 2)

#### 2a. useSignal (Days 1-2)

**Test file:** `src/react/__tests__/use-signal.test.ts`

Tests (using @testing-library/react):
- Component renders signal value
- Component re-renders when signal changes
- Component does not re-render when unrelated signal changes
- Multiple components sharing same signal all update
- Component unmount unsubscribes
- Works with React.StrictMode (double-mount)
- Server-side: getServerSnapshot returns current value

**Implementation file:** `src/react/use-signal.ts`

Key design: use `useSyncExternalStore` with an internal `_subscribe` method on signals (not the tracking-based `effect`):

```typescript
export function useSignal<T>(sig: Signal<T>): T {
  return useSyncExternalStore(
    (notify) => sig._subscribe(notify),
    () => sig.peek(),
    () => sig.peek(),
  );
}
```

Signals need an internal `_subscribe(callback): unsubscribe` method separate from the tracking system. This avoids the first-run problem with effect-based subscription.

#### 2b. useComputed (Days 2-3)

**Test file:** `src/react/__tests__/use-computed.test.ts`

Tests:
- `useComputed(() => sig.value * 2)` returns derived value
- Re-renders when upstream signal changes
- Memoizes the computed across re-renders
- Disposes computed on unmount

**Implementation:** `useComputed` creates a `computed` in `useMemo`, subscribes via `useSignal`, and disposes on unmount.

**Phase 2 exit criteria:** All React tests pass in jsdom, works with React 18 and 19, no StrictMode warnings, react bundle <1KB gzipped.

---

### Phase 3: Deep Reactivity (Weeks 3-4)

#### 3a. Object Proxy (Days 1-3)

**Test file:** `src/core/__tests__/proxy-object.test.ts`

Tests:
- Reading `.value.a` tracks that specific property
- Setting `.value.a = 3` notifies only subscribers of `.a`
- Nested objects track nested properties
- Adding/deleting properties
- `Object.keys()` tracking
- `JSON.stringify()` works correctly
- Setting `.value = entirelyNewObject` replaces the whole thing

**Implementation file:** `src/core/proxy.ts`

Uses WeakMap for proxy cache and per-property signal nodes. Lazy child proxification.

#### 3b. Array Proxy (Days 3-4)

**Test file:** `src/core/__tests__/proxy-array.test.ts`

Tests: index access, `push`, `splice`, `pop`, `shift`, `unshift`, `sort`, `reverse`, `.length`, iteration.

#### 3c. Map and Set Proxy (Days 5-7)

**Test files:** `src/core/__tests__/proxy-map.test.ts`, `src/core/__tests__/proxy-set.test.ts`

Map: `.get()`, `.set()`, `.delete()`, `.has()`, `.size`, iteration.
Set: `.has()`, `.add()`, `.delete()`, `.size`, iteration.

**Phase 3 exit criteria:** All proxy tests pass, no memory leaks, core bundle still <3KB gzipped.

---

### Phase 4: Store Layer (Week 4)

#### Store API Design

**Decision: Closure-based (Option C)** -- simplest, no magic, perfect type inference:

```typescript
const count = signal(0);
const doubled = computed(() => count.value * 2);
const store = createStore({
  count,
  doubled,
  increment() { count.value++ }
});
```

The store is a typed namespace/grouping mechanism. `createStore` returns a `Store<T>` that preserves types.

**Test file:** `src/store/__tests__/create-store.test.ts`
**Test file:** `src/store/__tests__/use-store.test.ts`

`useStore(store, selector)` -- selector is required for reactive subscription. Without selector, returns store object (non-reactive at top level).

---

### Phase 5: SignalValue Component (Week 4, Days 4-5)

**Test file:** `src/react/__tests__/signal-value.test.tsx`

Simple component wrapper using `useSignal` internally for render isolation.

---

### Phase 6: SSR and React 19 Compatibility (Week 5)

- `useSyncExternalStore` handles SSR via `getServerSnapshot`
- Test `renderToString` with signal values
- Test against React 19 RC -- verify compiler-safe patterns
- No reliance on referential identity of callbacks

---

### Phase 7: CI/CD and Publishing

Replace current workflow with:

**`.github/workflows/ci.yml`** -- PR/push to main: pnpm install, lint, typecheck, test, build, size check. Matrix: Node 20, 22.

**`.github/workflows/publish.yml`** -- tag push (`v*`): build, test, publish to npm with provenance.

Package checklist: `files` field, `sideEffects: false`, proper `exports` map with `types` first.

---

## File Structure

```
rxor/
  .github/workflows/
    ci.yml
    publish.yml
  src/
    core/
      __tests__/
        signal.test.ts
        computed.test.ts
        effect.test.ts
        batch.test.ts
        graph.test.ts
        proxy-object.test.ts
        proxy-array.test.ts
        proxy-map.test.ts
        proxy-set.test.ts
      index.ts
      types.ts
      graph.ts
      signal.ts
      computed.ts
      effect.ts
      batch.ts
      untracked.ts
      proxy.ts
    react/
      __tests__/
        use-signal.test.ts
        use-computed.test.ts
        signal-value.test.tsx
        ssr.test.ts
      index.ts
      use-signal.ts
      use-computed.ts
      signal-value.tsx
    store/
      __tests__/
        create-store.test.ts
        use-store.test.ts
      index.ts
      create-store.ts
      use-store.ts
  package.json
  pnpm-lock.yaml
  tsconfig.json
  tsup.config.ts
  biome.json
  vitest.config.ts
  .size-limit.json
  .gitignore
  README.md
  LICENSE
```

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Proxy performance for large objects | Lazy proxification, benchmark tests |
| Memory leaks from stale subscriptions | Automatic dep cleanup on re-track, WeakMap |
| React Compiler breaks hook semantics | Test against React 19 early, compiler-safe patterns only |
| Bundle size exceeds 3KB | size-limit in CI, tree-shakeable Proxy code |
| Circular computed dependencies | Detect during tracking, throw with clear error |
| Diamond problem causes double computation | Version-based dirty checking |
