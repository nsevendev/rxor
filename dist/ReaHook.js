var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useState, useEffect } from "react";
import { rxStore } from "./RxStore";
import { rxservice } from "./GetService";
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
export const useRxCompute = (serviceKey, method) => {
    const service = rxservice(serviceKey);
    return useReaCompute(method(service));
};
export const useRxFetch = (serviceKey, method, errorCustom) => {
    const service = rxservice(serviceKey);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchData = () => __awaiter(void 0, void 0, void 0, function* () {
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
                yield method(service);
            }
            catch (err) {
                if (err instanceof Error) {
                    setError(err);
                    if (errorCustom) {
                        throw errorCustom(err);
                    }
                }
                else {
                    const error = new Error(`An error occurred: ${err}`);
                    setError(error);
                    if (errorCustom) {
                        throw errorCustom(error);
                    }
                }
            }
            finally {
                setLoading(false);
            }
        });
        fetchData();
    }, [method, service, serviceKey, errorCustom]);
    return { loading, error };
};
export const useRxStore = (key) => {
    const store = rxStore.getStore(key);
    if (!store || !store.reaxar) {
        console.warn(`Store with key "${key}" not found or not ready. Returning undefined.`);
        return undefined;
    }
    return useRea(store.reaxar);
};
