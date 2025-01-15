import { ReaXor } from "./ReaXor";
export type StoreMap = Record<string, ReaXor<any>>;
export declare class RxStore {
    private stores;
    addStore: <T>(key: string, store: ReaXor<T>) => void;
    getStores: () => StoreMap;
    getStore: <T>(key: string) => ReaXor<T> | undefined;
    hasStore: (key: string) => boolean;
    reset: () => void;
}
export declare const rxStore: RxStore;
