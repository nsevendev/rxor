import { reaxar } from "./Rea";
import { rxStore } from "./RxStore";
import { ReaXar } from "./ReaXar";

export class ReaXor<T> {
  private readonly store: ReaXar<T>;
  private readonly initialValue: T;

  private constructor(initialValue: T) {
    this.initialValue = initialValue;
    this.store = reaxar<T>(initialValue);
  }
  
  static create<T>(initialValue: T, keyStore: string): ReaXor<T> {
    const instance = new ReaXor<T>(initialValue);
    rxStore.addStore<T>(keyStore, instance);
    return instance;
  }

  get reaxar(): ReaXar<T> {
    return this.store;
  }

  // Getter to access the current value
  get value(): T {
    return this.store.value;
  }

  // Setter to change the value
  set value(newValue: T) {
    this.store.value = newValue;
  }

  // Method to reset the blind to its initial value
  reset(): void {
    this.store.value = this.initialValue;
  }

  // Method to subscribe to changes
  subscribe(callback: (value: T) => void): void {
    this.store.subscribe(callback);
  }
}
