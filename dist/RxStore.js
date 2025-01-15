export class RxStore {
    constructor() {
        this.stores = {};
        this.addStore = (key, store) => {
            if (this.stores[key]) {
                console.warn(`Store with key "${key}" already exists. Overwriting.`);
            }
            this.stores[key] = store;
        };
        this.getStores = () => {
            return this.stores;
        };
        this.getStore = (key) => {
            const store = this.stores[key];
            if (!store) {
                return undefined;
            }
            return store;
        };
        this.hasStore = (key) => {
            return !!this.stores[key];
        };
        this.reset = () => {
            this.stores = {};
        };
    }
}
export const rxStore = new RxStore();
