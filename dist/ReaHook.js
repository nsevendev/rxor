import { useState, useEffect } from "react";
import { rxStore } from "./RxStore";
import { rxService } from "./RxService";
export function useRea(variable) {
    const [value, setValue] = useState(variable.value);
    useEffect(() => {
        const subscription = variable.subscribe(setValue);
        return () => subscription.unsubscribe();
    }, [variable]);
    return value;
}
export function useReaCompute(observable) {
    const [value, setValue] = useState();
    useEffect(() => {
        const subscription = observable.subscribe((value) => {
            setValue(value);
        });
        return () => subscription.unsubscribe();
    }, [observable]);
    return value;
}
export const getService = (key) => {
    const service = rxService.getService(key);
    if (!service) {
        throw new Error(`Service with key "${key}" not found.`);
    }
    return service;
};
export const useRxCompute = (serviceKey, method) => {
    const service = getService(serviceKey);
    return useReaCompute(method(service));
};
export const useRxStore = (key) => {
    const store = rxStore.getStore(key);
    if (!store || !store.reaxar) {
        console.warn(`Store with key "${key}" not found or not ready. Returning undefined.`);
        return undefined;
    }
    return useRea(store.reaxar);
};
