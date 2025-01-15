import { Observable, OperatorFunction, Subscription } from "rxjs";
export declare class ReaXar<T> {
    private subject;
    constructor(initialValue: T);
    get value(): T;
    set value(newValue: T);
    subscribe: (callback: (value: T) => void) => Subscription;
    unsubscribe: (subscription: Subscription) => void;
    pipe: <R>(...operators: OperatorFunction<T, R>[]) => Observable<R>;
    computed: <R>(callback: (value: T, index: number) => R) => Observable<R>;
}
