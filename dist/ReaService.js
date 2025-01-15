import { rxService } from "./RxService";
export class ReaService {
    constructor(key) {
        this.rxService = rxService;
        if (this.rxService.hasService(key)) {
            console.warn(`Service with key "${key}" already exists. Overwriting.`);
        }
        this.rxService.addService(key, this);
    }
}
