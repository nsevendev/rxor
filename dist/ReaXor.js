import { reaxar } from "./Rea";
import { rxStore } from "./RxStore";
export class ReaXor {
    constructor(initialValue) {
        this.initialValue = initialValue;
        this.store = reaxar(initialValue);
    }
    static create(initialValue, keyStore) {
        const instance = new ReaXor(initialValue);
        rxStore.addStore(keyStore, instance);
        return instance;
    }
    get reaxar() {
        return this.store;
    }
    // Getter to access the current value
    get value() {
        return this.store.value;
    }
    // Setter to change the value
    set value(newValue) {
        this.store.value = newValue;
    }
    // Method to reset the blind to its initial value
    reset() {
        this.store.value = this.initialValue;
    }
    // Method to subscribe to changes
    subscribe(callback) {
        this.store.subscribe(callback);
    }
}
