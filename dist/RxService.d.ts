import { ReaService } from "./ReaService";
export type ServiceMap = Record<string, ReaService<any>>;
export declare class RxService {
    private services;
    addService: <T>(key: string, service: ReaService<T>) => void;
    getServices: () => ServiceMap;
    getService: <T>(key: string) => T;
    hasService: (key: string) => boolean;
    reset: () => void;
}
export declare const rxService: RxService;
