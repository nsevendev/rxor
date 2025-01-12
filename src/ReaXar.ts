import {
  BehaviorSubject,
  map,
  Observable,
  OperatorFunction,
  Subscription,
} from "rxjs";

export class ReaXar<T> {
  private subject: BehaviorSubject<T>;

  constructor(initialValue: T) {
    this.subject = new BehaviorSubject(initialValue);
  }

  // Getter to access the current value
  get value(): T {
    return this.subject.getValue();
  }

  // Setter to change the value and notify subscribers
  set value(newValue: T) {
    this.subject.next(newValue);
  }

  // Method to subscribe to value changes
  subscribe = (callback: (value: T) => void): Subscription => {
    return this.subject.asObservable().subscribe(callback);
  };

  // Method to manually clean subscriptions if needed
  unsubscribe = (subscription: Subscription) => {
    subscription.unsubscribe();
  };

  // Pipe method to apply RxJS operators
  pipe = <R>(...operators: OperatorFunction<T, R>[]): Observable<R> => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return this.subject.asObservable().pipe(...operators);
  };

  computed = <R>(callback: (value: T, index: number) => R): Observable<R> => {
    return this.subject.asObservable().pipe(map(callback));
  };
}
