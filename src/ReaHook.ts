import { useState, useEffect } from "react";
import { Observable } from "rxjs";
import { ReaXarType } from "./type";
import { rxStore } from "./RxStore";
import {rxService} from "./RxService";

export const getService = <T>(key: string): T => {
  const service = rxService.getService<T>(key);
  
  if (!service) {
    throw new Error(`Service with key "${key}" not found.`);
  }
  
  return service;
}

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

export const useRxCompute = <T, R>(
    serviceKey: string,
    method: (service: T) => Observable<R>
): R | undefined => {
  const service = getService<T>(serviceKey);
  
  return useReaCompute(method(service));
};

export const useRxFetch = <T, R = Error>(
    serviceKey: string,
    method: (service: T) => Promise<void>,
    errorCustom?: (error: any) => R
) => {
  const service = getService<T>(serviceKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!service) {
        const error = new Error(`Service "${serviceKey}" not found.`);
        setError(error);
        if (errorCustom) {
          throw errorCustom(error);
        }
        return;
      }
      
      setLoading(true);
      
      try {
        await method(service);
      } catch (err) {
        if (err instanceof Error) {
          setError(err);
          if (errorCustom) {
            throw errorCustom(err);
          }
        }else {
          const error = new Error(`An error occurred: ${err}`);
          setError(error);
          if (errorCustom) {
            throw errorCustom(error);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [method, service, serviceKey, errorCustom]);
  
  return { loading, error };
}

export const useRxStore = <T>(key: string): T | undefined => {
  const store = rxStore.getStore<T>(key);
  
  if (!store || !store.reaxar) {
    console.warn(`Store with key "${key}" not found or not ready. Returning undefined.`);
    return undefined;
  }
  
  return useRea<T>(store.reaxar);
};

