export interface ReadonlySignal<T> {
  readonly value: T;
  peek(): T;
  subscribe(callback: (value: T) => void): () => void;
}

export interface Signal<T> extends ReadonlySignal<T> {
  value: T;
}

export interface Computed<T> extends ReadonlySignal<T> {}
