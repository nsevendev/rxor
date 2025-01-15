import { BehaviorSubject, map, } from "rxjs";
export class ReaXar {
    constructor(initialValue) {
        // Method to subscribe to value changes
        this.subscribe = (callback) => {
            return this.subject.asObservable().subscribe(callback);
        };
        // Method to manually clean subscriptions if needed
        this.unsubscribe = (subscription) => {
            subscription.unsubscribe();
        };
        // Pipe method to apply RxJS operators
        this.pipe = (...operators) => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            return this.subject.asObservable().pipe(...operators);
        };
        this.computed = (callback) => {
            return this.subject.asObservable().pipe(map(callback));
        };
        this.subject = new BehaviorSubject(initialValue);
    }
    // Getter to access the current value
    get value() {
        return this.subject.getValue();
    }
    // Setter to change the value and notify subscribers
    set value(newValue) {
        this.subject.next(newValue);
    }
}
