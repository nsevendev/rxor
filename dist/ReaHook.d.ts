import { Observable } from "rxjs";
import { ReaXar } from "./ReaXar";
export declare function useRea<T>(variable: ReaXar<T>): T;
export declare function useReaCompute<T>(observable: Observable<T>): T | undefined;
export declare const useRxCompute: <T, R>(serviceKey: string, method: (service: T) => Observable<R>) => R | undefined;
export declare const useRxFetch: <T, R = Error>(serviceKey: string, method: (service: T) => Promise<void>, errorCustom?: (error: any) => R) => {
    loading: boolean;
    error: Error | null;
};
export declare const useRxStore: <T>(key: string) => T | undefined;
