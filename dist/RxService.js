export class RxService {
    constructor() {
        this.services = {};
        this.addService = (key, service) => {
            if (this.services[key]) {
                console.warn(`Service with key "${key}" already exists. Overwriting.`);
            }
            this.services[key] = service;
        };
        this.getServices = () => {
            return this.services;
        };
        this.getService = (key) => {
            const service = this.services[key];
            return service;
        };
        this.hasService = (key) => {
            return !!this.services[key];
        };
        this.reset = () => {
            this.services = {};
        };
    }
}
export const rxService = new RxService();
