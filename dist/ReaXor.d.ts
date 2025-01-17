import { ReaXar } from "./ReaXar";
export declare class ReaXor<T> {
    private readonly store;
    private readonly initialValue;
    private constructor();
    static create<T>(initialValue: T, keyStore: string): ReaXor<T>;
    get reaxar(): ReaXar<T>;
    get value(): T;
    set value(newValue: T);
    reset(): void;
    toObject(): T;
    subscribe(callback: (value: T) => void): void;
}
