# Rxor Documentation

- Rxor is a lightweight and versatile library for managing reactive states with React.  
  This documentation provides a complete guide to understanding and using rxor

- Rxor uses `rxjs` as a subpackage, and needs `React 18.0.0` minimum and `Typescript 5.0.0` minimum to work.

_Installing `rxjs` in your project is **optional**.  
The `ReaXar` Class provides a pipe function that allows you to provide a series of `rxjs` `operators`,  
in this case you will need to install `rxjs` to provide its `operators` to the method._

---

## Installation

```bash
npm install rxor
```

---

## Create a reactive instance  

### `reaxar()`  

- `todo` and `todo2` are a reactive instance, of type `class ReaXar` and has methods  
that you can use to interact with it.

```ts
// For use reaxar()
import { rea } from "rxor";

type TodoType = { id: number; title: string; done: boolean };

const todo = reaxar<TodoType>({ id: 0, title: "Todo", done: false });
const todo2 = reaxar<TodoType | null>(null);
```

### `useRea()` hook

- But above all you can use it in a component using the `useRea` hook made available to you.

- Here `useRea()` must take an argument of type `ReaXar`, and return its value.  
  `useRea()` is a custom hook that will subscribe to the value of the reactive variable,  
  and will update the component every time the value changes.  
  in case of destruction of the component, the subscription is removed.

- This means that if the value of `todo` is changed in another component,
  it will automatically update in the `MyComponent` component.

```tsx
// For use useRea()
import { reaxar } from "rxor";
import { useRea } from "rxor";

type TodoType = { id: number; title: string; done: boolean };
const todo = reaxar<TodoType>({ id: 0, title: "Todo", done: false });

// in component
export const MyComponent = () => {
  const todo = useRea<TodoType>(todo);
  
  return (
    <>
      <p>id : {todo.id}</p>
      <p>title : {todo.title}</p>
      <p>done : {todo.done}</p>
    </>
  );
};
```

### Type of `class ReaXar`  

- `reaxar()` returns an instance of the `ReaXar` class  
- `useRea()` takes an argument of type `ReaXar` and returns its value.  

**do not use `new ReaXar()` directly, use `reaxar()` instead  
and use `useRea()` in your components for subscribe to the value of the reactive variable.  
and use the methods of the `ReaXar` class to interact with the reactive variable.**

```ts
// It's the type of ReaXar class
export declare class ReaXar<T> {
  private subject;
  constructor(initialValue: T);
  get value(): T;
  set value(newValue: T);
  subscribe: (callback: (value: T) => void) => Subscription;
  unsubscribe: (subscription: Subscription) => void;
  pipe: <R>(...operators: OperatorFunction<T, R>[]) => Observable<R>;
  computed: <R>(callback: (value: T, index: number) => R) => Observable<R>;
}
```

Now use an instance of the `ReaXar` class in your store, service or other  
and use `useRea` to access the reactive variable of your store in any component,  
change the value of your `ReaXar`, all your components will be updated directly  

---
