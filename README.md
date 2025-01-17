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

- `reaxar()` returns an instance of the `ReaXar` class (check list of methods)  
- `useRea()` takes an argument of type `ReaXar` and returns its value. (check list of hooks)  

**do not use `new ReaXar()` directly, use `reaxar()` instead  
and use `useRea()` in your components for subscribe to the value of the reactive variable.  
and use the methods of the `ReaXar` class to interact with the reactive variable.**

```ts
// It's the type of ReaXar class
export declare class ReaXar<T> {
  private subject;
  constructor(initialValue: T);
  // value at the moment
  get value(): T;
  // the value setter
  set value(newValue: T);
  // subscribe to the value
  subscribe: (callback: (value: T) => void) => Subscription;
  // unsubscribe to the value
  unsubscribe: (subscription: Subscription) => void;
  // listen for the value change and apply rxjs operators
  pipe: <R>(...operators: OperatorFunction<T, R>[]) => Observable<R>;
  // listen for the value change and allow to return a modification without modifying the original value
  computed: <R>(callback: (value: T, index: number) => R) => Observable<R>;
}
```

Now use an instance of the `ReaXar` class in your store, service or other  
and use `useRea` to access the reactive variable of your store in any component,  
change the value of your `ReaXar`, all your components will be updated directly  

---  

## Store and service management  

- rxor has a store and service system, which will allow you to properly separate  
your business part from the rest of your application.

- This system follows a simple logic which is:  
  - First:  
  one store has one/many service,  
  the store has the data and the service interacts with this data  

  - Second:  
  the store contains the data and therefore it is accessible in reading in the components  
  using custom hooks and fully reactive. The service has a service store accessible  
  throughout the application to facilitate access. modification of the data.  

- The store must be injected into the service and each service created and which extends `ReaService`  
will be injected into a "service store" accessible in all services  
(which will allow for example a task service to have access to the category service very easily)  

### `ReaXor`  

- `ReaXor` is composed of a ReaXar type "store" property and accessibility methods in addition to the ReaXar methods  

- For create a store, use a static function of ReaXor,  
with first argument the initial value of the store  
and the second argument the name of the store.  

**the name of the store is required, it will be used to access the store  
in the component with the hook `useRxStore` (check a list of the hook)**  

1. Create a type of the store
2. Create a store with a static function of ReaXor `ReaXor.create()`  
   internally ReaXor registers the store in a "store register" and creates an instance of ReaXar  
   which it stores in a "store" property of your instance.  
3. Use the store in a component with the hook `useRxStore`  
   it returns the value of your store and this value will be fully reactive,  
   if changes are made elsewhere in the application the value of the store in your component  
   will be updated automatically

```tsx
import { ReaXor, useRxStore } from "rxor";

// 1. create a type for store
type TodoType = {id: number, title: string, done: boolean};

// 2. create a store
const todoStore = ReaXor.create<TodoType[]>([], "todoStore");

// 3. use in a component
export const ListTodo = () => {
  const todos = useRxStore<TodoType[]>("todoStore");
  
  return (
          <>
            <div>
              <div>
                {todos!.length > 0 
                    ? todos!.map((todo: TodoType) => <p>{todo.title}</p>) 
                    : <p>Not todo</p>
                }
              </div>
            </div>
          </>
  )
}
```

### Type of `ReaXor`  

```ts
export declare class ReaXor<T> {
    private readonly store;
    private readonly initialValue;
    private constructor();
    // create a instance of ReaXor
    static create<T>(initialValue: T, keyStore: string): ReaXor<T>;
    // get the ReaXar instance of property store in ReaXor, access to the ReaXar methods
    get reaxar(): ReaXar<T>;
    // value at the moment
    get value(): T;
    // the value setter
    set value(newValue: T);
    // reset your value with inital value
    reset(): void;
    // subscribe to the value
    subscribe(callback: (value: T) => void): void;
}
```

---  

## `ReaService`  

`ReaService` is an abstract class that will extend your service classes,  
and add your services in a "service registry", accessible in all your services.  

- Easy to use you have to give it the interface of your service  
and the name of your service to the super function of your class  

### Create your service

```ts
import { ReaService } from "rxor";

// use type or interface
export type TodoServiceType = {
  todoStore: () => ReaXor<TodoType[]>,
  createTodo: (title: string) => TodoType,
  addTodo: (todo: TodoType) => void,
  removeTodo: (id: number) => void,
  toggleTodo: (id: number) => void,
  deleteTodoChecked: () => void,
}

// typed ReaService with TodoServiceType
export class TodoService extends ReaService<TodoServiceType> {
  private todoStore: ReaXor<TodoType[]>;

  constructor(todoStore: ReaXor<TodoType[]>) {
      // call a super function and give the name for service
    super("todoService");
    this.todoStore = todoStore
  }

  todoStore = (): ReaXor<TodoType[]> => {
    return this.todoStore
  }
  
  // function util for just create object of todo, is just for example
  createTodo = (title: string): TodoType => {
    return {
      id: this.generateUniqueId(), // just for example
      title,
      done: false
    } as TodoType
  }
  
  addTodo = (todo: TodoType): void => {
    this.todoStore.value = [...this.todos.value, todo]
  }

  removeTodo = (id: number): void => {
    this.todoStore.value = this.todoStore.value.filter((todo: TodoType) => todo.id !== id)
  }

  toggleTodo = (id: number): void => {
    this.todoStore.value = this.todoStore.value.map((todo: TodoType) => todo.id === id ? {...todo, done: !todo.done} : todo)
  }

  deleteTodoChecked = (): void => {
    this.todoStore.value = this.todoStore.value.filter((todo: TodoType) => !todo.done)
  }
}
```

### Instance of your class

- Create your instance of your service class and inject the store in the constructor  
- Now you can use your service with a register of service `rxservice()` (check list of methods)  

**you have nothing else to do**

```ts
import {todoStore} from './todoStore'

new TodoService(todoStore);
```  

### Call a service in another service  

- call another service in a class, ReaService provides you  
with a `rxService` instance of RxService (a register of service) with a method `getService`  
that allows you to access all the services you will need.  

```ts
class AnotherService extends ReaService<AnotherServiceType> {
  private anotherStore: ReaXor<AnotherType[]>;

  constructor(anotherStore: AnotherStore) {
    super("anotherService");
    this.anotherStore = anotherStore;
  }

  // use the todoService
  addTodo = (todo): ReaXor<TodoType[]> => {
    this.rxService.getService("todoService").addTodo(todo);
  }
  
  // ... all methods for store Another
}
```

### Call service in component  

- You can use the `rxservice()` (check list methods) function to access your service in a component.  

```tsx
export const CheckAllTodo = () => {
  const handlerChange = (e: ChangeEvent<HTMLInputElement>) => {
    rxservice<TodoServiceType>("todoService").checked(e.currentTarget.checked)
  }

  return (// ... your jsx)
}
```

---  

## List of class  

#### `ReaXor` // create a store for your reactive properties  
#### `ReaService` // extends your service with him  

---  

## List of methods  

#### `reaxar()` // create a reactive instance de type ReaXar
#### `rxservice()` // it's a register of services

### Type  
```ts
export declare function reaxar<T>(initialValue: T): ReaXar<T>;
export declare const rxservice: <T>(key: string) => T;
```

---  

## List of hooks  

#### `useRea()` // subscribe to the value of a ReaXar instance
#### `useReaCompute()` // subscribe to the value of a ReaXar instance and apply rxjs operators
#### `useRxCompute()` // subscribe to the value of a ReaXar instance and allow to return a modification without modifying the original value  
prefer this method to the method `useReaCompute` if you want to return a modification without modifying the original value
```ts
const isCheckedAll = useRxCompute<TodoServiceType, boolean>(
    "todoService", 
    (service) => service.isAllTodoChecked() // call a fonction of service
)
```
#### `useRxFetch()` // subscribe to the value of a ReaXar instance and fetch data from an api  
#### `useRxStore()` // subscribe to the value of a ReaXar instance in a store

### Type  
```ts
export declare function useRea<T>(variable: ReaXar<T>): T;
export declare function useReaCompute<T>(observable: Observable<T>): T | undefined;
export declare const useRxCompute: <T, R>(serviceKey: string, method: (service: T) => Observable<R>) => R | undefined;
export declare const useRxFetch: <T, R = Error>(serviceKey: string, method: (service: T) => Promise<void>, errorCustom?: (error: any) => R) => {
  loading: boolean;
  error: Error | null;
};
export declare const useRxStore: <T>(key: string) => T | undefined;
```  
<br>
<br>
