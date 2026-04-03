# rxor

Fine-grained reactive signals for React.

**Zero dependency** core. **~2KB** gzipped. Works with **React 18+** and **React 19**.

rxor brings reactive signals to React, inspired by Angular Signals, Vue 3 `ref/computed`, and SolidJS.

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

**Compatibility:** Works with any React UI library (Mantine, MUI, Chakra, Ant Design, etc.).

---

## Quick start

```tsx
import { signal, computed, SignalValue } from 'rxor'

const count = signal(0)
const doubled = computed(() => count.value * 2)

function Counter() {
  // This component renders ONCE and never re-renders
  return (
    <div>
      <p>Count: <SignalValue signal={count} /></p>
      <p>Doubled: <SignalValue signal={doubled} /></p>
      <button onClick={() => count.value++}>+1</button>
    </div>
  )
}
```

When `count` changes, only the two `<SignalValue>` texts update. The `Counter` function never re-runs. The `<button>` never re-renders.

---

## Two ways to read a signal in React

rxor provides two approaches. Choose based on your needs.

### `useSignal` — simple, the component re-renders

```tsx
import { signal, useSignal } from 'rxor'

const name = signal("John")

function Greeting() {
  const n = useSignal(name)  // the component re-renders when name changes
  return <p>Hello, {n}!</p>
}
```

Use `useSignal` when you need the value as a variable (for logic, props, conditions, loops).

### `<SignalValue>` — fine-grained, the component never re-renders

```tsx
import { signal, SignalValue } from 'rxor'

const name = signal("John")

function Greeting() {
  // No hook, no re-render. This function runs ONCE.
  return <p>Hello, <SignalValue signal={name} />!</p>
}
```

Use `<SignalValue>` when you just need to display a value (text, number). It creates a micro-component that updates independently.

### Do not mix both for the same signal

```tsx
// BAD — redundant, the component re-renders AND SignalValue re-renders
const n = useSignal(name)
<p><SignalValue signal={name} /></p>

// GOOD — pick one
const n = useSignal(name)        // Option A: component re-renders
<p>{n}</p>

<p><SignalValue signal={name} /></p>  // Option B: only the text re-renders
```

### When to use which?

| Situation | Use |
|---|---|
| Display a text/number in JSX | `<SignalValue>` |
| Pass a value as prop to a component | `useSignal` |
| Use a value in a condition or loop | `useSignal` |
| Maximum performance, zero re-renders | `<SignalValue>` |
| Simple and quick | `useSignal` |

---

## Core API

### `signal<T>(initial): Signal<T>`

A reactive container. Reading `.value` tracks dependencies. Writing `.value` notifies subscribers.

```ts
import { signal } from 'rxor/core'

const name = signal("John")

name.value          // read: "John"
name.value = "Jane" // write: notifies all subscribers
name.peek()         // read without tracking: "Jane"
```

#### Supported types

```ts
// Primitives
const count = signal(0)                       // Signal<number>
const label = signal("hello")                 // Signal<string>
const active = signal(true)                   // Signal<boolean>
const maybe = signal<string | null>(null)     // Signal<string | null>

// Objects — each property is tracked independently
const user = signal({ name: "John", age: 25 })
user.value.name = "Jane"  // notifies only watchers of .name, not .age

// Arrays — mutations are intercepted
const list = signal([1, 2, 3])
list.value.push(4)        // notifies watchers
list.value.splice(0, 1)   // notifies watchers
list.value[0] = 99        // notifies watchers

// Map
const cache = signal(new Map<string, number>())
cache.value.set("key", 42)    // notifies watchers
cache.value.delete("key")     // notifies watchers

// Set
const tags = signal(new Set<string>())
tags.value.add("urgent")      // notifies watchers
tags.value.delete("urgent")   // notifies watchers
```

#### Deep reactivity

When a signal holds an object, each property is tracked independently:

```ts
const state = signal({ a: { x: 1 }, b: { y: 2 } })

effect(() => {
  console.log(state.value.a.x)  // tracks only a.x
})

state.value.b.y = 99  // does NOT re-run the effect
state.value.a.x = 10  // re-runs the effect
```

| Method | Description |
|---|---|
| `.value` | Read (with tracking) or write the value |
| `.peek()` | Read without creating a dependency |
| `.subscribe(cb)` | Listen for changes, returns an unsubscribe function |

---

### `computed<T>(fn): Computed<T>`

A derived value that recalculates automatically when its dependencies change.

```ts
import { signal, computed } from 'rxor/core'

const price = signal(100)
const tax = signal(0.2)
const total = computed(() => price.value * (1 + tax.value))

total.value   // 120
price.value = 200
total.value   // 240 — recalculated automatically
```

Key behaviors:
- **Lazy** — does not compute until `.value` is read
- **Cached** — does not recompute if dependencies haven't changed
- **Readonly** — setting `.value` throws an error
- **Nested** — a computed can depend on other computeds

```ts
const firstName = signal("John")
const lastName = signal("Doe")
const fullName = computed(() => `${firstName.value} ${lastName.value}`)
const greeting = computed(() => `Hello, ${fullName.value}!`)

greeting.value   // "Hello, John Doe!"
firstName.value = "Jane"
greeting.value   // "Hello, Jane Doe!"
```

---

### `effect(fn): () => void`

Runs a function immediately, then re-runs it whenever its dependencies change. Returns a dispose function.

```ts
import { signal, effect } from 'rxor/core'

const count = signal(0)

const dispose = effect(() => {
  console.log("Count:", count.value)
})
// logs: "Count: 0"

count.value = 5
// logs: "Count: 5"

dispose()
count.value = 10  // nothing happens
```

#### Replaces most `useEffect` usage

```ts
// Sync with localStorage
effect(() => {
  localStorage.setItem("theme", theme.value)
})

// Update document title
effect(() => {
  document.title = `(${unreadCount.value}) Messages`
})

// Log changes
effect(() => {
  console.log("User changed:", user.value)
})
```

#### Cleanup

Return a function from the effect for cleanup before each re-run:

```ts
const userId = signal(1)

effect(() => {
  const ws = new WebSocket(`/ws/user/${userId.value}`)
  return () => ws.close()  // cleanup before re-run
})
```

#### Dynamic dependencies

Effects automatically re-track dependencies on each run:

```ts
const toggle = signal(true)
const a = signal("A")
const b = signal("B")

effect(() => {
  console.log(toggle.value ? a.value : b.value)
})

b.value = "B2"       // does NOT re-run (toggle is true, b not tracked)
toggle.value = false  // re-runs, logs "B2"
a.value = "A2"        // does NOT re-run (toggle is false, a not tracked)
```

---

### `batch(fn)`

Groups multiple signal writes into a single notification:

```ts
import { signal, effect, batch } from 'rxor/core'

const a = signal(1)
const b = signal(2)

effect(() => {
  console.log(a.value + b.value)
})
// logs: 3

batch(() => {
  a.value = 10
  b.value = 20
})
// logs: 30 (once, not twice)
```

---

### `untracked(fn)`

Read signal values without creating dependencies:

```ts
import { signal, effect, untracked } from 'rxor/core'

const count = signal(0)
const label = signal("hello")

effect(() => {
  const c = count.value                       // tracked
  const l = untracked(() => label.value)      // NOT tracked
  console.log(c, l)
})

label.value = "world"  // does NOT re-run the effect
count.value = 1        // re-runs the effect
```

---

## React hooks

### `useSignal<T>(signal): T`

Subscribe to a signal. The component re-renders when the signal changes.

Uses `useSyncExternalStore` — concurrent mode safe and SSR compatible.

```tsx
import { signal, computed, useSignal } from 'rxor'

const count = signal(0)
const doubled = computed(() => count.value * 2)

function Display() {
  const c = useSignal(count)
  const d = useSignal(doubled)
  return <p>{c} x2 = {d}</p>
}
```

### `useComputed<T>(fn): T`

Create a computed inline in a component:

```tsx
import { signal, useComputed } from 'rxor'

const price = signal(100)
const quantity = signal(3)

function Total() {
  const total = useComputed(() => price.value * quantity.value)
  return <p>Total: {total}</p>
}
```

---

## Store

### `createStore(definition)`

Group signals, computed, and actions into a typed store:

```ts
import { signal, computed, createStore } from 'rxor'

const count = signal(0)

export const counterStore = createStore({
  count,
  doubled: computed(() => count.value * 2),
  increment() { count.value++ },
  decrement() { count.value-- },
  reset() { count.value = 0 },
})
```

### `useStore(store, selector)`

Subscribe to a specific signal from a store. The component only re-renders when **that signal** changes:

```tsx
import { useStore } from 'rxor'
import { counterStore } from '../store/counterStore'

function Counter() {
  const count = useStore(counterStore, s => s.count)
  const doubled = useStore(counterStore, s => s.doubled)

  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={counterStore.increment}>+1</button>
    </div>
  )
}
```

---

## Architecture: Services

rxor does not include a service system in the package. You don't need one — a TypeScript class with signals is a service.

### Why services?

In React, business logic often ends up inside components. With rxor, you separate concerns:

- **Service** = business logic, data, API calls
- **Component** = reads and displays, no logic

This is the same architecture as Angular services, but without decorators or dependency injection framework.

### Creating a service

```ts
// service/UserService.ts
import { signal, computed } from 'rxor/core'

type User = { id: number; name: string; role: string }

export class UserService {
  // Private state — components cannot write directly
  private readonly _users = signal<User[]>([])
  private readonly _loading = signal(false)
  private readonly _error = signal<string | null>(null)
  private readonly _search = signal("")

  // Public state — read only
  readonly loading = this._loading
  readonly error = this._error
  readonly search = this._search

  readonly users = computed(() => {
    const s = this._search.value.toLowerCase()
    if (!s) return this._users.value
    return this._users.value.filter(u => u.name.toLowerCase().includes(s))
  })

  readonly count = computed(() => this.users.value.length)

  // Actions
  async loadUsers() {
    this._loading.value = true
    this._error.value = null
    try {
      const res = await fetch("/api/users")
      this._users.value = await res.json()
    } catch (e) {
      this._error.value = (e as Error).message
    } finally {
      this._loading.value = false
    }
  }

  addUser(name: string, role: string) {
    this._users.value = [...this._users.value, { id: Date.now(), name, role }]
  }

  removeUser(id: number) {
    this._users.value = this._users.value.filter(u => u.id !== id)
  }

  setSearch(value: string) {
    this._search.value = value
  }
}
```

### Instantiating services

```ts
// service/index.ts
import { UserService } from './UserService'
import { AuthService } from './AuthService'

export const userService = new UserService()
export const authService = new AuthService()
```

### Using in a component

The component is "stupid" — it reads and displays, nothing else:

```tsx
// components/UserTable.tsx
import { useSignal } from 'rxor/react'
import { userService } from '../service'
import { useEffect } from 'react'

export function UserTable() {
  const users = useSignal(userService.users)
  const loading = useSignal(userService.loading)
  const error = useSignal(userService.error)
  const count = useSignal(userService.count)

  useEffect(() => { userService.loadUsers() }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <div>
      <h2>Users ({count})</h2>
      <input
        placeholder="Search..."
        onChange={e => userService.setSearch(e.target.value)}
      />
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name} ({user.role})
            <button onClick={() => userService.removeUser(user.id)}>X</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Service with pagination

```ts
// service/ProductService.ts
import { signal, computed } from 'rxor/core'

type Product = { id: number; name: string; price: number }

type PaginationMeta = {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export class ProductService {
  private readonly _products = signal<Product[]>([])
  private readonly _loading = signal(false)
  private readonly _error = signal<string | null>(null)
  private readonly _pagination = signal<PaginationMeta>({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  })

  readonly products = this._products
  readonly loading = this._loading
  readonly error = this._error
  readonly pagination = this._pagination
  readonly hasNextPage = computed(() => this._pagination.value.page < this._pagination.value.totalPages)
  readonly hasPrevPage = computed(() => this._pagination.value.page > 1)

  async loadProducts(page = 1) {
    this._loading.value = true
    this._error.value = null
    try {
      const size = this._pagination.value.pageSize
      const res = await fetch(`/api/products?page=${page}&size=${size}`)
      const data = await res.json()
      this._products.value = data.items
      this._pagination.value = {
        page: data.page,
        pageSize: data.pageSize,
        totalItems: data.total,
        totalPages: Math.ceil(data.total / data.pageSize),
      }
    } catch (e) {
      this._error.value = (e as Error).message
    } finally {
      this._loading.value = false
    }
  }

  nextPage() {
    if (this.hasNextPage.value) {
      this.loadProducts(this._pagination.value.page + 1)
    }
  }

  prevPage() {
    if (this.hasPrevPage.value) {
      this.loadProducts(this._pagination.value.page - 1)
    }
  }
}
```

```tsx
// components/ProductList.tsx
import { useSignal } from 'rxor/react'
import { productService } from '../service'
import { useEffect } from 'react'

export function ProductList() {
  const products = useSignal(productService.products)
  const loading = useSignal(productService.loading)
  const pagination = useSignal(productService.pagination)
  const hasNext = useSignal(productService.hasNextPage)
  const hasPrev = useSignal(productService.hasPrevPage)

  useEffect(() => { productService.loadProducts() }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h2>Products (page {pagination.page} / {pagination.totalPages})</h2>

      <ul>
        {products.map(p => (
          <li key={p.id}>{p.name} — {p.price}$</li>
        ))}
      </ul>

      <button disabled={!hasPrev} onClick={() => productService.prevPage()}>Previous</button>
      <span> Page {pagination.page} of {pagination.totalPages} </span>
      <button disabled={!hasNext} onClick={() => productService.nextPage()}>Next</button>
    </div>
  )
}
```

### Service-to-service communication

Services can depend on each other via constructor injection:

```ts
// service/OrderService.ts
import { signal } from 'rxor/core'
import type { AuthService } from './AuthService'

export class OrderService {
  constructor(private auth: AuthService) {}

  private readonly _orders = signal([])
  readonly orders = this._orders

  async placeOrder(productId: number) {
    if (!this.auth.isLoggedIn.value) {
      throw new Error("Not authenticated")
    }
    // ...
  }
}
```

```ts
// service/index.ts
import { AuthService } from './AuthService'
import { UserService } from './UserService'
import { OrderService } from './OrderService'

export const authService = new AuthService()
export const userService = new UserService()
export const orderService = new OrderService(authService)
```

### Recommended project structure

```
src/
├── service/
│   ├── AuthService.ts
│   ├── UserService.ts
│   ├── ProductService.ts
│   ├── OrderService.ts
│   └── index.ts              ← instantiation
├── components/
│   ├── UserTable.tsx          ← reads userService
│   ├── ProductList.tsx        ← reads productService
│   ├── LoginForm.tsx          ← reads authService
│   └── Header.tsx
└── App.tsx
```

---

## What re-renders and what doesn't?

### With `useSignal` — the component re-renders, not its parents

```tsx
const name = signal("John")
const age = signal(25)

function NameDisplay() {
  const n = useSignal(name)    // re-renders only when name changes
  return <p>{n}</p>
}

function AgeDisplay() {
  const a = useSignal(age)     // re-renders only when age changes
  return <p>{a}</p>
}

function App() {
  // NEVER re-renders
  return (
    <div>
      <NameDisplay />
      <AgeDisplay />
      <button onClick={() => name.value = "Jane"}>Change name</button>
    </div>
  )
}

// Click "Change name":
//   App         → does NOT re-render
//   NameDisplay → re-renders (reads name)
//   AgeDisplay  → does NOT re-render (reads age, not name)
```

### With `<SignalValue>` — nothing re-renders except the text

```tsx
const count = signal(0)
const parity = computed(() => count.value % 2 === 0 ? 'Even' : 'Odd')

function Counter() {
  // This component NEVER re-renders
  return (
    <div>
      <p><SignalValue signal={count} /></p>     {/* only this text updates */}
      <p><SignalValue signal={parity} /></p>    {/* only this text updates */}
      <button onClick={() => count.value++}>+1</button>
    </div>
  )
}
```

### How to verify in the browser

1. Install the **React Developer Tools** browser extension
2. Open DevTools (F12) → go to the **Profiler** tab
3. Click the gear icon → check **"Highlight updates when components render"**
4. Interact with your app — components that re-render flash with a colored border

---

## When do you still need `useEffect`?

rxor's `effect()` replaces most `useEffect` usage, but not all.

| Situation | Use `effect()` from rxor | Use `useEffect` from React |
|---|---|---|
| React to data changes | Yes | No |
| Sync localStorage / document.title | Yes | No |
| Log / analytics on change | Yes | No |
| Load data when the app starts | Yes (runs immediately) | No |
| Load data when a component mounts | No | Yes |
| Focus an input on mount | No | Yes |
| Set up a timer / interval | No | Yes |
| Add event listeners on window | No | Yes |

In practice, rxor eliminates 80-90% of `useEffect` calls. The remaining ones are for DOM-specific lifecycle operations.

---

## Imports

rxor has three entry points for tree-shaking:

```ts
// Core only (zero dependency, works without React)
import { signal, computed, effect, batch, untracked } from 'rxor/core'

// React hooks and components
import { useSignal, useComputed, SignalValue } from 'rxor/react'

// Store
import { createStore, useStore } from 'rxor/store'

// Or import everything from the root
import { signal, computed, useSignal, SignalValue, createStore } from 'rxor'
```

---

## API reference

### Core (`rxor/core`)

| Export | Description |
|---|---|
| `signal(initial)` | Create a reactive signal |
| `computed(fn)` | Create a derived computed value |
| `effect(fn)` | Run a side effect that re-runs on dependency changes |
| `batch(fn)` | Group updates into a single notification |
| `untracked(fn)` | Read values without tracking |

### React (`rxor/react`)

| Export | Description |
|---|---|
| `useSignal(signal)` | Subscribe to a signal, component re-renders on change |
| `useComputed(fn)` | Create and subscribe to an inline computed |
| `<SignalValue signal={sig} />` | Display a signal value without re-rendering the parent |

### Store (`rxor/store`)

| Export | Description |
|---|---|
| `createStore(def)` | Group signals, computed, and actions |
| `useStore(store, selector)` | Subscribe to a specific signal in a store |

### Types

```ts
interface Signal<T> {
  value: T
  peek(): T
  subscribe(cb: (value: T) => void): () => void
}

interface Computed<T> {
  readonly value: T
  peek(): T
  subscribe(cb: (value: T) => void): () => void
}
```

---

## License

MIT
