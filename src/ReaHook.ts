import { useState, useEffect } from "react";
import { Observable } from "rxjs";
import { ReaXarType } from "./type";
import { rxStore } from "./RxStore";

export function useRea<T>(variable: ReaXarType<T>): T {
  const [value, setValue] = useState(variable.value);

  useEffect(() => {
    const subscription = variable.subscribe(setValue);
    return () => subscription.unsubscribe();
  }, [variable]);

  return value;
}

export function useReaCompute<T>(observable: Observable<T>): T | undefined {
  const [value, setValue] = useState<T>();

  useEffect(() => {
    const subscription = observable.subscribe((value) => {
      setValue(value);
    });
    return () => subscription.unsubscribe();
  }, [observable]);

  return value;
}

export const useRxStore = <T = unknown>(key: string): T | undefined => {
  const store = rxStore.getStore<any>(key);
  
  if (!store || !store.reaxar) {
    console.warn(`Store with key "${key}" not found or not ready. Returning undefined.`);
    return undefined;
  }
  
  return useRea<T>(store.reaxar);
};
