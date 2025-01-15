import { ReaService } from "./ReaService";

export type ServiceMap = Record<string, ReaService<any>>

export class RxService {
    private services: ServiceMap = {} as ServiceMap;
    
    addService = <T>(key: string, service: ReaService<T>): void => {
        if (this.services[key]) {
            console.warn(`Service with key "${key}" already exists. Overwriting.`);
        }
        this.services[key] = service;
    }
    
    getServices = (): ServiceMap => {
        return this.services;
    }
    
    getService = <T>(key: string): T => {
        const service = this.services[key];
        return service as T;
    }
    
    hasService = (key: string): boolean => {
        return !!this.services[key];
    }
    
    reset = (): void => {
        this.services = {} as ServiceMap;
    }
}

export const rxService = new RxService();
