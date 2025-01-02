// ReaHook.ts
import { useState, useEffect } from "react";
import { Observable } from "rxjs";
import { ReaXarType } from "./type";

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
