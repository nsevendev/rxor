import { Observable } from "rxjs";
import { ReaXarType } from "./type";
export declare function useRea<T>(variable: ReaXarType<T>): T;
export declare function useReaCompute<T>(observable: Observable<T>): T | undefined;
export declare const getService: <T>(key: string) => T;
export declare const useRxCompute: <T, R>(serviceKey: string, method: (service: T) => Observable<R>) => R | undefined;
export declare const useRxStore: <T = unknown>(key: string) => T | undefined;
