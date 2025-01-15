import { rxService } from "./RxService";

export abstract class ReaService<T> {
    protected rxService = rxService;
    
    protected constructor(key: string) {
        if (this.rxService.hasService(key)) {
            console.warn(`Service with key "${key}" already exists. Overwriting.`);
        }
        this.rxService.addService<T>(key, this);
    }
}
