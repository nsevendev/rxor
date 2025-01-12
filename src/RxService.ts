import { ReaService } from "./ReaService";

export type ServiceMap = Record<string, ReaService<any, any>>;

export class RxService<R extends string> {
    private services: ServiceMap = {};
    
    addService = <T>(key: R, service: ReaService<T, R>): void => {
        if (this.services[key]) {
            console.warn(`Service with key "${key}" already exists. Overwriting.`);
        }
        this.services[key] = service;
    }
    
    getServices = (): ServiceMap => {
        return this.services;
    }
    
    getService = <T>(key: R): T => {
        const service = this.services[key];
        return service as T;
    }
    
    hasService = (key: string): boolean => {
        return !!this.services[key];
    }
    
    reset = (): void => {
        this.services = {};
    }
}

