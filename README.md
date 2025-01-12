# Reactivizor Documentation

- Reactivizor is a lightweight and versatile library for managing reactive states with React.  
This documentation provides a complete guide to understanding and using Reactivizor  

- Reactivizor uses `rxjs` as a subpackage, and needs `React 18.0.0` minimum and `Typescript 5.0.0` minimum to work.  

*Installing `rxjs` in your project is **optional**.  
The `ReaXar` Class provides a pipe function that allows you to provide a series of `rxjs` `operators`,  
in this case you will need to install `rxjs` to provide its `operators` to the method.*  

---

## Installation

```bash
npm install reactivizor
```

---

## Function, class, type available  
```ts
// All core functionality
class ReaXar
class ReaXor
function rea()

// React hooks for Reactivizor
function useRea()
function useReaCompute()

// Types
type ReaXarType
type ReaXorType
type ReaType
type UseReaType
type UseReaComputeType
```

## Create a reactive variable `rea()`
```ts
import { rea } from 'reactivizor';

type TodoType = { id: number, title: string, done: boolean };

const todo = rea<TodoType>({ id: 0, title: 'Todo', done: false });
const todo2 = rea<TodoType | null>(null);
```

- Now `todo` and `todo2` is a reactive variable, of type ReaXarType and has methods  
that you can use to interact with it.  
- But above all you can use it in a component using the `useRea` hook made available to you.  

```tsx
// in TodoStore.ts
import { rea } from 'reactivizor';
export type TodoType = { id: number, title: string, done: boolean };
export const todo = rea<TodoType>({ id: 0, title: 'Todo', done: false });

// in MyComponent.tsx
import { useRea} from 'reactivizor';
import { todo, TodoType } from './TodoStore';

export const MyComponent = () => {
    const todo = useRea<TodoType>(todo)
    return (
        <>
            <p>id : {todo.id}</p>
            <p>title : {todo.title}</p>
            <p>done : {todo.done}</p>
        </>
    )
}
```  

- Here `useRea()` must take an argument of type `ReaXarType`, and return its value.  
`useRea()` is a custom hook that will subscribe to the value of the reactive variable,  
and will update the component every time the value changes.  
in case of destruction of the component, the subscription is removed.    

- This means that if in another component you change the value of `todo`,  
it will be automatically updated in the `MyComponent` component.

```tsx
// in TodoStore.ts
import { rea } from 'reactivizor';
export type TodoType = { id: number, title: string, done: boolean };
export const todo = rea<TodoType>({ id: 0, title: 'Todo', done: false });

// in MyComponent.tsx
import { useRea } from 'reactivizor';
import { todo, TodoType } from './TodoStore';

export const MyComponent = () => {
    const todo = useRea<TodoType>(todo)
    return (
        <>
            <p>id : {todo.id}</p>
            <p>title : {todo.title}</p>
            <p>done : {todo.done}</p>
        </>
    )
}

// in UpdateTitleTodo.tsx
import { todo } from './TodoStore';

export const UpdateTitleTodo = () => {
    const updateTitle = () => {
        todo.value = {...todo.value, title: 'new todo 1'}
    }
    
    return (
        <>
            <button onClick={updateTitle}>Update title</button>
        </>
    )
}

// todo.title will be updated in MyComponent and toto.title will be 'new todo 1'
```  

- In the example above, if you click the `Update title` button,  
the value of `todo` will be updated, and the component `MyComponent` will be updated.  

- this is a simple example to show you how reactive variables work,  
of course it is better to create services that will take care of making the modifications  
in order to centralize the modifications and make the code more readable.  

**`rea()` is just a factory of the `ReaXar` class and allows you to create reactive variables  
and provides you with methods to interact with these variables.**  

- It is quite possible to imagine a class with properties of type `ReaXarType`
```ts
import { rea } from 'reactivizor';

class Todo {
    private todos: ReaXarType<TodoType[]>;
    private length: ReaXarType<number>;
    
    constructor(todos: ReaXarType<TodoType[]>) {
        this.todos = todos
        this.length = rea<number>(0)
    }
    
    getTodo = (): ReaXarType<TodoType[]> => {
        return this.todos
    }
    
    getLength = (): ReaXarType<number> => {
        return this.length
    }
    
    lengthTodo = (): void => {
        this.todos.subscribe((todos: TodoType[]) => {
            this.length.value = todos.length
        })
    }
}

const myTodo = new Todo(rea<TodoType[]>([] as TodoType[]))

myTodo.getTodo().value // display an empty array
myTodo.getLength().value // display 0
myTodo.lengthTodo() // subscribe to the length of the array

myTodo.getTodo().value = [...myTodo.getTodo().value, {id: 2, title: 'todo 2', done: false} as TodoType] // add a new element to the array
myTodo.getTodo().value[0].title // display a value of title of the first element of the array

myTodo.getLength().value // display 1
```  

- you can build as you want  

---  

## Create a reactive store `ReaXor`  

- In a larger project with a large business part and difficult data management.  
It is better to use `ReaXor` which will create a class with a single property which will be of type `ReaXarType`,  
in order to force you to separate things.  

```ts
// In TodoStore.ts
import {ReaXor} from "reactivizor";

export type TodoType = {id: number, title: string, done: boolean};
export const todoStore = new ReaXor<TodoType[]>([])
```  

- This amounts to doing for you what we did with `ReaXar()`  
but with the difference that you will have a class with a single property of type `ReaXarType`  
and you will have to use the methods of the `ReaXor` class to interact with the property.  
For exemple in a service class.  

```ts
// In TodoService.ts
import {ReaXorType} from "reactivizor"
import {todoStore, TodoType} from "./TodoStore.ts"
import {map} from "rxjs";

class TodoService {
    private todos: ReaXorType<TodoType[]>;
    
    constructor(todoStore: ReaXorType<TodoType[]>) {
        this.todos = todoStore
    }
    
    // Here it is better to use a DTO, for the example I use a utility function
    createTodo = (title: string): TodoType => {
        return {
            id: this.generateUniqueId(),
            title,
            done: false
        } as TodoType
    }
    
    addTodo = (todo: TodoType): void => {
        this.todos.value = [...this.todos.value, todo]
    }
    
    removeTodo = (id: number): void => {
        this.todos.value = this.todos.value.filter((todo: TodoType) => todo.id !== id)
    }
    
    toggleTodo = (id: number): void => {
        this.todos.value = this.todos.value.map((todo: TodoType) => todo.id === id ? {...todo, done: !todo.done} : todo)
    }
    
    deleteTodoChecked = (): void => {
        this.todos.value = this.todos.value.filter((todo: TodoType) => !todo.done)
    }
    
    private generateUniqueId = (): number => {
        let id: number;
        do {
            id = Math.floor(Math.random() * 1_000_000);
        } while (this.todos.value.some((todo: TodoType) => todo.id === id));
        return id;
    }
}

// we give our TodoStore as an argument and our service will take care of its manipulations
export const todoService = new TodoService(todoStore);
```

- Now you can use our store and service in components.  

```tsx
// In Input.tsx
import React, {FC} from "react";

export const Input: FC<{
    id: string,
    value: string,
    onChange?: React.ChangeEventHandler<HTMLInputElement>
}> = ({id, value, onChange}) => {
    return (
        <>
            <input id={id} type="text" value={value} onChange={onChange}/>
        </>
    )
}

// In FormAddTodo.tsx
import { FormEvent, useState } from "react";
import { Input } from "./Input.tsx";
import { todoService } from "../Module/Todo/TodoService.ts";

export const FormAddTodo = () => {
    // is juste for value of input
    const [value, setValue] = useState<string>('')
    
    const handlerSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        // use todoService, he has a method for todoStore
        todoService.addTodo(todoService.createTodo(value))
        setValue('')
    }
    
    return (
        <>
            <form onSubmit={handlerSubmit}>
                <div>
                    <Input id={"Add todo"} value={value} onChange={(e) => setValue(e.currentTarget.value)}/>
                    <button type={"submit"}>Add</button>
                    // here we use the service to delete the checked todos in jsx is done
                    <button type={"button"} onClick={todoService.deleteTodoChecked}>Delete Todo Checked</button>
                </div>
            </form>
        </>
    )
}

// In ListTodo.tsx
import { todoStore, TodoType } from "../Module/Todo/TodoStore.ts";
import { todoService } from "../Module/Todo/TodoService.ts";
import { useRea } from "reactivizor";

export const ListTodo = () => {
    
    // here reaxar is a property of the ReaXor class and she get the ReaXarType value of our store
    // todos is nom a reactive variable
    const todos = useRea<TodoType[]>(todoStore.reaxar)
    
    return (
        <>
            <div>
                {todos.map((todo: TodoType) => (
                    <div key={todo.id}>
                        <input
                            type="checkbox"
                            checked={todo.done || false}
                            // toggle todo when click on checkbox
                            onChange={() => todoService.toggleTodo(todo.id)}
                        />
                        <p>{todo.title}</p>
                        // delete todo when click on button delete
                        <button onClick={() => todoService.removeTodo(todo.id)}>Delete</button>
                    </div>
                ))}
            </div>
        </>
    )
}

// In App.tsx
import { ListTodo } from "./Component/ListTodo.tsx";
import { FormAddTodo } from "./Component/FormAddTodo.tsx";

export const App = () => {
    return (
        <>
            <h1>Todo</h1>
            <FormAddTodo/>
            <ListTodo/>
        </>
    )
}
```
