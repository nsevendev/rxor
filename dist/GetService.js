import { rxService } from "./RxService";
export const rxservice = (key) => {
    const service = rxService.getService(key);
    if (!service) {
        throw new Error(`Service with key "${key}" not found.`);
    }
    return service;
};
