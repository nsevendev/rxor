import {rxService} from "./RxService";

export const getService = <T>(key: string): T => {
    const service = rxService.getService<T>(key);
    
    if (!service) {
        throw new Error(`Service with key "${key}" not found.`);
    }
    
    return service;
}
