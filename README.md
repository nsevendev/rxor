# rxor

Fine-grained reactive signals for React.

**Zero dependency** core. **~2KB** gzipped. Works with **React 18+** and **React 19**.

rxor brings true fine-grained reactivity to React, inspired by Angular Signals, Vue 3 `ref/computed`, and SolidJS. Only the parts of your UI that depend on a changed signal re-render.

---

## Installation

```bash
npm install rxor
# or
pnpm add rxor
# or
yarn add rxor
```

**Requirements:** React 18.0+ and TypeScript 5.0+

---

## Quick start

```tsx
import { signal, computed } from 'rxor/core';
import { useSignal } from 'rxor/react';

// Create a signal (can live outside a component)
const count = signal(0);
const doubled = computed(() => count.value * 2);

function Counter() {
  const c = useSignal(count);
  const d = useSignal(doubled);

  return (
    <div>
      <p>Count: {c}</p>
      <p>Doubled: {d}</p>
      <button onClick={() => count.value++}>+1</button>
    </div>
  );
}
```

---

## Core concepts

### `signal<T>(initial): Signal<T>`

A reactive container for a value. Reading `.value` tracks the signal as a dependency. Writing `.value` notifies all subscribers.

```ts
import { signal } from 'rxor/core';

const name = signal("John");

// Read
name.value; // "John"

// Write (notifies subscribers)
name.value = "Jane";

// Read without tracking (no dependency created)
name.peek(); // "Jane"
```

Supports all types:

```ts
// Primitives
const count = signal(0);                       // Signal<number>
const label = signal("hello");                 // Signal<string>
const active = signal(true);                   // Signal<boolean>
const maybe = signal<string | null>(null);     // Signal<string | null>

// Objects — deep reactivity via Proxy
const user = signal({ name: "John", age: 25 });
user.value.name = "Jane";  // notifies only watchers of .name

// Arrays — mutations intercepted
const list = signal([1, 2, 3]);
list.value.push(4);       // notifies watchers
list.value.splice(0, 1);  // notifies watchers
list.value[0] = 99;       // notifies watchers

// Map
const cache = signal(new Map<string, number>());
cache.value.set("key", 42);   // notifies watchers
cache.value.delete("key");    // notifies watchers

// Set
const tags = signal(new Set<string>());
tags.value.add("urgent");     // notifies watchers
tags.value.delete("urgent");  // notifies watchers
```

#### Deep reactivity

When a signal holds an object, each property is tracked independently. Changing one property only notifies watchers of that specific property:

```ts
const state = signal({ a: { x: 1 }, b: { y: 2 } });

effect(() => {
  console.log(state.value.a.x);  // tracks a.x only
});

state.value.b.y = 99;  // does NOT re-run the effect above
state.value.a.x = 10;  // re-runs the effect
```

#### Signal API

| Method | Description |
|---|---|
| `.value` | Read (with tracking) or write the value |
| `.peek()` | Read without creating a dependency |
| `.subscribe(cb)` | Listen for changes, returns an unsubscribe function |

---

### `computed<T>(fn): Computed<T>`

A derived signal that auto-tracks its dependencies and recalculates lazily.

```ts
import { signal, computed } from 'rxor/core';

const price = signal(100);
const tax = signal(0.2);
const total = computed(() => price.value * (1 + tax.value));

total.value;  // 120

price.value = 200;
total.value;  // 240 — recalculated automatically
```

Key behaviors:
- **Lazy** — does not compute until `.value` is read
- **Cached** — does not recompute if dependencies haven't changed
- **Readonly** — setting `.value` throws an error
- **Nested** — a computed can depend on other computeds

```ts
const firstName = signal("John");
const lastName = signal("Doe");
const fullName = computed(() => `${firstName.value} ${lastName.value}`);
const greeting = computed(() => `Hello, ${fullName.value}!`);

greeting.value;  // "Hello, John Doe!"
firstName.value = "Jane";
greeting.value;  // "Hello, Jane Doe!"
```

---

### `effect(fn): () => void`

Runs a function immediately and re-runs it whenever its tracked dependencies change. Returns a dispose function.

```ts
import { signal, effect } from 'rxor/core';

const count = signal(0);

const dispose = effect(() => {
  console.log("Count is:", count.value);
});
// logs: "Count is: 0"

count.value = 5;
// logs: "Count is: 5"

dispose();  // stops the effect
count.value = 10;  // nothing happens
```

#### Cleanup

Return a function from the effect to run cleanup before each re-run and on dispose:

```ts
const userId = signal(1);

effect(() => {
  const ws = new WebSocket(`/ws/user/${userId.value}`);

  return () => {
    ws.close();  // cleanup: close previous connection
  };
});
```

#### Dynamic dependencies

Effects automatically re-track dependencies on each run:

```ts
const toggle = signal(true);
const a = signal("A");
const b = signal("B");

effect(() => {
  // When toggle is true, tracks 'a'. When false, tracks 'b'.
  console.log(toggle.value ? a.value : b.value);
});

b.value = "B2";  // does NOT re-run (toggle is true, b is not tracked)
toggle.value = false;  // re-runs, now logs "B2"
a.value = "A2";  // does NOT re-run (toggle is false, a is not tracked)
```

---

### `batch(fn)`

Groups multiple signal writes into a single notification cycle:

```ts
import { signal, effect, batch } from 'rxor/core';

const a = signal(1);
const b = signal(2);

effect(() => {
  console.log(a.value + b.value);
});
// logs: 3

batch(() => {
  a.value = 10;
  b.value = 20;
});
// logs: 30 (only once, not twice)
```

---

### `untracked(fn)`

Read signal values without creating dependencies:

```ts
import { signal, effect, untracked } from 'rxor/core';

const count = signal(0);
const label = signal("hello");

effect(() => {
  const c = count.value;  // tracked
  const l = untracked(() => label.value);  // NOT tracked
  console.log(c, l);
});

label.value = "world";  // does NOT re-run the effect
count.value = 1;  // re-runs the effect
```

---

## React hooks

### `useSignal<T>(signal): T`

Subscribe to a signal in a React component. The component re-renders when the signal changes.

Uses `useSyncExternalStore` under the hood — concurrent mode safe and SSR compatible.

```tsx
import { signal } from 'rxor/core';
import { useSignal } from 'rxor/react';

const name = signal("John");

function Greeting() {
  const n = useSignal(name);
  return <p>Hello, {n}!</p>;
}
```

Works with computed signals too:

```tsx
const count = signal(0);
const doubled = computed(() => count.value * 2);

function Display() {
  const d = useSignal(doubled);
  return <p>Doubled: {d}</p>;
}
```

---

### `useComputed<T>(fn): T`

Create a computed value inline in a component and subscribe to it:

```tsx
import { signal } from 'rxor/core';
import { useComputed } from 'rxor/react';

const price = signal(100);
const quantity = signal(3);

function Total() {
  const total = useComputed(() => price.value * quantity.value);
  return <p>Total: {total}</p>;
}
```

---

### `<SignalValue signal={sig} />`

A micro-component for **fine-grained rendering**. It subscribes to a signal and renders only its value. The parent component never re-renders.

```tsx
import { signal } from 'rxor/core';
import { SignalValue } from 'rxor/react';

const name = signal("John");
const age = signal(25);

function UserCard() {
  // This component renders ONCE. Never re-renders.
  return (
    <div>
      <p>Name: <SignalValue signal={name} /></p>
      <p>Age: <SignalValue signal={age} /></p>
    </div>
  );
}

// Somewhere else:
name.value = "Jane";  // Only the name <SignalValue> updates, nothing else
```

This is how rxor achieves fine-grained reactivity in React. Each `<SignalValue>` is an independent subscriber — the parent component function never re-runs.

---

## Store

### `createStore(definition)`

Group related signals, computed values, and actions into a typed store:

```ts
import { signal, computed } from 'rxor/core';
import { createStore } from 'rxor/store';

const count = signal(0);

export const counterStore = createStore({
  // Signals
  count,

  // Computed
  doubled: computed(() => count.value * 2),
  isPositive: computed(() => count.value > 0),

  // Actions
  increment() { count.value++; },
  decrement() { count.value--; },
  reset() { count.value = 0; },
});
```

### `useStore(store, selector)`

Subscribe to a specific signal or computed from a store:

```tsx
import { useStore } from 'rxor/store';
import { counterStore } from './counterStore';

function Counter() {
  const count = useStore(counterStore, s => s.count);
  const doubled = useStore(counterStore, s => s.doubled);

  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={counterStore.increment}>+1</button>
      <button onClick={counterStore.reset}>Reset</button>
    </div>
  );
}
```

The selector returns a specific signal, so the component only re-renders when **that** signal changes.

---

## Real-world examples

### Todo list

```ts
// store/todoStore.ts
import { signal, computed } from 'rxor/core';
import { createStore } from 'rxor/store';

type Todo = { id: number; title: string; done: boolean };

const todos = signal<Todo[]>([]);
let nextId = 1;

export const todoStore = createStore({
  todos,

  remaining: computed(() => todos.value.filter(t => !t.done).length),

  add(title: string) {
    todos.value = [...todos.value, { id: nextId++, title, done: false }];
  },

  toggle(id: number) {
    todos.value = todos.value.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    );
  },

  remove(id: number) {
    todos.value = todos.value.filter(t => t.id !== id);
  },

  clearCompleted() {
    todos.value = todos.value.filter(t => !t.done);
  },
});
```

```tsx
// components/TodoApp.tsx
import { useStore } from 'rxor/store';
import { useSignal } from 'rxor/react';
import { signal } from 'rxor/core';
import { todoStore } from '../store/todoStore';

const inputValue = signal("");

export function TodoApp() {
  const todos = useStore(todoStore, s => s.todos);
  const remaining = useStore(todoStore, s => s.remaining);
  const input = useSignal(inputValue);

  return (
    <div>
      <h1>Todos ({remaining} remaining)</h1>

      <form onSubmit={(e) => {
        e.preventDefault();
        if (input.trim()) {
          todoStore.add(input);
          inputValue.value = "";
        }
      }}>
        <input
          value={input}
          onChange={e => inputValue.value = e.target.value}
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>

      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <label>
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => todoStore.toggle(todo.id)}
              />
              {todo.title}
            </label>
            <button onClick={() => todoStore.remove(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>

      <button onClick={todoStore.clearCompleted}>Clear completed</button>
    </div>
  );
}
```

### Form with validation

```ts
// store/formStore.ts
import { signal, computed } from 'rxor/core';
import { createStore } from 'rxor/store';

const email = signal("");
const password = signal("");
const submitted = signal(false);

export const formStore = createStore({
  email,
  password,
  submitted,

  emailError: computed(() => {
    if (!submitted.value) return "";
    if (!email.value) return "Email is required";
    if (!email.value.includes("@")) return "Invalid email";
    return "";
  }),

  passwordError: computed(() => {
    if (!submitted.value) return "";
    if (!password.value) return "Password is required";
    if (password.value.length < 8) return "Password must be at least 8 characters";
    return "";
  }),

  isValid: computed(() => {
    return email.value.includes("@") && password.value.length >= 8;
  }),

  submit() {
    submitted.value = true;
  },

  reset() {
    email.value = "";
    password.value = "";
    submitted.value = false;
  },
});
```

### Shared state across components

```ts
// store/themeStore.ts
import { signal, computed } from 'rxor/core';
import { createStore } from 'rxor/store';

const mode = signal<"light" | "dark">("light");

export const themeStore = createStore({
  mode,

  isDark: computed(() => mode.value === "dark"),

  toggle() {
    mode.value = mode.value === "light" ? "dark" : "light";
  },
});
```

```tsx
// Any component anywhere in the app
import { useStore } from 'rxor/store';
import { themeStore } from '../store/themeStore';

function Header() {
  const isDark = useStore(themeStore, s => s.isDark);
  return (
    <header className={isDark ? "dark" : "light"}>
      <button onClick={themeStore.toggle}>Toggle theme</button>
    </header>
  );
}

function Footer() {
  const isDark = useStore(themeStore, s => s.isDark);
  return <footer className={isDark ? "dark" : "light"}>Footer</footer>;
}
```

### Deep object state

```ts
import { signal, effect } from 'rxor/core';

const settings = signal({
  notifications: {
    email: true,
    push: false,
    sms: false,
  },
  profile: {
    name: "John",
    avatar: "/default.png",
  },
});

// Only reacts to notification changes, not profile changes
effect(() => {
  console.log("Email notifications:", settings.value.notifications.email);
});

settings.value.profile.name = "Jane";       // effect does NOT re-run
settings.value.notifications.email = false;  // effect re-runs
```

### Using with Map and Set

```ts
import { signal, effect } from 'rxor/core';

// Map for key-value data
const userCache = signal(new Map<string, { name: string; role: string }>());

effect(() => {
  const admin = userCache.value.get("admin");
  console.log("Admin:", admin?.name ?? "not loaded");
});

userCache.value.set("admin", { name: "Alice", role: "admin" });
// logs: "Admin: Alice"

// Set for unique collections
const selectedIds = signal(new Set<number>());

effect(() => {
  console.log("Selected count:", selectedIds.value.size);
});

selectedIds.value.add(1);
selectedIds.value.add(2);
selectedIds.value.delete(1);
// logs: 1, 2, 1
```

---

## Imports

rxor has three entry points for tree-shaking:

```ts
// Core only (zero dependency, framework-agnostic)
import { signal, computed, effect, batch, untracked } from 'rxor/core';

// React hooks and components
import { useSignal, useComputed, SignalValue } from 'rxor/react';

// Store
import { createStore, useStore } from 'rxor/store';

// Or import everything from the root
import { signal, computed, effect, useSignal, createStore } from 'rxor';
```

---

## API reference

### Core (`rxor/core`)

| Export | Type | Description |
|---|---|---|
| `signal(initial)` | `Signal<T>` | Create a reactive signal |
| `computed(fn)` | `Computed<T>` | Create a derived computed value |
| `effect(fn)` | `() => void` | Run a side effect, returns dispose function |
| `batch(fn)` | `void` | Group updates into a single notification |
| `untracked(fn)` | `T` | Read values without tracking |

### React (`rxor/react`)

| Export | Type | Description |
|---|---|---|
| `useSignal(signal)` | `T` | Subscribe to a signal in a component |
| `useComputed(fn)` | `T` | Create and subscribe to an inline computed |
| `<SignalValue signal={sig} />` | Component | Fine-grained rendering |

### Store (`rxor/store`)

| Export | Type | Description |
|---|---|---|
| `createStore(def)` | `T` | Group signals, computed, and actions |
| `useStore(store, selector)` | `T` | Subscribe to a store signal |

### Types (`rxor/core`)

```ts
interface Signal<T> {
  value: T;
  peek(): T;
  subscribe(cb: (value: T) => void): () => void;
}

interface Computed<T> {
  readonly value: T;
  peek(): T;
  subscribe(cb: (value: T) => void): () => void;
}

type ReadonlySignal<T> = Signal<T> | Computed<T>;
```

---

## License

MIT
