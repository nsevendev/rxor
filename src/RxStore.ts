import { ReaXor } from "./ReaXor";

export type StoreMap = Record<string, ReaXor<any>>;

export class RxStore {
    private stores: StoreMap = {};
    
    addStore = <T>(key: string, store: ReaXor<T>): void => {
        if (this.stores[key]) {
            console.warn(`Store with key "${key}" already exists. Overwriting.`);
        }
        this.stores[key] = store;
    }
    
    getStores = (): StoreMap => {
        return this.stores;
    }
    
    getStore = <T>(key: string): ReaXor<T> | undefined => {
        const store = this.stores[key];
        if (!store) {
            return undefined
        }
        return store as ReaXor<T>;
    }
    
    hasStore = (key: string): boolean => {
        return !!this.stores[key];
    }
    
    reset = (): void => {
        this.stores = {};
    }
}

export const rxStore = new RxStore();
