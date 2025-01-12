import { rea } from "./Rea";
import { ReaXarType } from "./type";
import { RxStore } from "./RxStore";

export class ReaXor<T> {
  private readonly store: ReaXarType<T>;
  private readonly initialValue: T;

  private constructor(initialValue: T) {
    this.initialValue = initialValue;
    this.store = rea<T>(initialValue);
  }
  
  static create<T>(initialValue: T, reaXorManager: RxStore, keyStore: string): ReaXor<T> {
    const instance = new ReaXor<T>(initialValue);
    reaXorManager.addStore<T>(keyStore, instance);
    return instance;
  }

  get reaxar(): ReaXarType<T> {
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

  // Method to convert the store to an object (useful for complex objects)
  toObject(): T {
    return this.store.value;
  }

  // Method to subscribe to changes
  subscribe(callback: (value: T) => void): void {
    this.store.subscribe(callback);
  }
}
