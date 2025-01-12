import {Observable, OperatorFunction, Subscription} from 'rxjs';

/**
 * A reactive variable that holds a single value.
 */
export type ReaXarType<T> = {
    /** Current value of the reactive variable. */
    value: T;
    /**
     * Subscribes to changes in the reactive variable.
     * @param callback - Function called with the new value whenever it changes.
     * @returns A subscription object to manage the subscription.
     */
    subscribe: (callback: (value: T) => void) => Subscription;
    /**
     * Manually unsubscribe from a given subscription.
     * @param subscription - The subscription object to unsubscribe.
     */
    unsubscribe: (subscription: Subscription) => void;
    /**
     * Applies a series of RxJS operators to the reactive stream.
     * @param operators - The RxJS operators to apply.
     * @returns An Observable of the transformed stream.
     */
    pipe: <R>(...operators: OperatorFunction<T, R>[]) => Observable<R>;
    /**
     * Creates a computed Observable based on the current value.
     * @param callback - A function that computes a new value based on the current value and index.
     * @returns An Observable of the computed value.
     */
    computed: <R>(callback: (value: T, index: number) => R) => Observable<R>;
};

/**
 * A reactive store that manages state and provides utilities for reactivity.
 */
export type ReaXorType<T> = {
    /** Current value of the reactive store. */
    value: T;
    /**
     * Subscribes to changes in the store's value.
     * @param callback - Function called with the new value whenever it changes.
     */
    subscribe: (callback: (value: T) => void) => void;
    /**
     * Resets the store to its initial value.
     */
    reset: () => void;
    /**
     * Converts the current store value to an object (useful for complex states).
     * @returns The current value of the store.
     */
    toObject: () => T;
    /**
     * Access to the underlying ReaXar instance.
     */
    reaxar: ReaXarType<T>;
    /**
     * Static method to create and register a new store.
     * @param initialValue - Initial value of the store.
     * @param reaXorManager - Instance of the ReaXorManager for registering the store.
     * @param keyStore - Unique key to register the store.
     * @returns A new instance of ReaXor.
     */
    create: (initialValue: T, reaXorManager: any, keyStore: string) => ReaXorType<T>;
};

export type RxStoreType = {
    /** Adds a store to the manager. */
    addStore: <T>(key: string, store: T) => void;
    
    /** Retrieves all stores. */
    getStores: () => StoreMap;
    
    /** Retrieves a specific store by its key. */
    getStore: <T>(key: string) => T;
    
    /** Checks if a store exists by its key. */
    hasStore: (key: string) => boolean
    
    /** Resets the manager by clearing all stores and services. */
    reset: () => void;
};

export type RxServiceType = {
    /** Adds a service to the manager. */
    addService: <T>(key: string, service: T) => void;
    
    /** Retrieves all services. */
    getServices: () => ServiceMap;
    
    /** Retrieves a specific service by its key. */
    getService: <T>(key: string) => T;
    
    /** Checks if a service exists by its key. */
    hasService: (key: string) => boolean
    
    /** Resets the manager by clearing all stores and services. */
    reset: () => void;
};

/**
 * Factory function to create a new reactive variable.
 */
export type ReaType = {
    /**
     * Creates a new ReaXar instance with an initial value.
     * @param initialValue - The initial value for the reactive variable.
     * @returns A new instance of ReaXar.
     */
        <T>(initialValue: T): ReaXarType<T>;
};

/**
 * React hook to use a ReaXar variable.
 */
export type UseReaType = {
    /**
     * Connects a ReaXar variable to a React component and subscribes to its changes.
     * @param variable - The ReaXar variable to connect.
     * @returns The current value of the variable.
     */
        <T>(variable: ReaXarType<T>): T;
};

/**
 * React hook to use an Observable as a computed value.
 */
export type UseReaComputeType = {
    /**
     * Connects an Observable to a React component and subscribes to its changes.
     * @param observable - The Observable to connect.
     * @returns The current computed value or undefined if not yet available.
     */
        <T>(observable: Observable<T>): T | undefined;
};
