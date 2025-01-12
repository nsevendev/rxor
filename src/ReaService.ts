import {RxService} from "./RxService";

export abstract class ReaService<T, R extends string> {
    protected constructor(key: R, rxService: RxService<R>) {
        if (rxService.hasService(key)) {
            console.warn(`Service with key "${key}" already exists. Overwriting.`);
        }
        rxService.addService<T>(key, this);
    }
}
