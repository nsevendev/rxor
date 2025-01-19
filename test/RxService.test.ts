import { RxService } from "../src/RxService";
import { ReaService } from "../src/ReaService";

class MockService extends ReaService<any> {
  constructor() {
    super("mockService");
  }
}

describe("RxService", () => {
  let rxService: RxService;

  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    rxService = new RxService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    rxService = new RxService();
  });

  // Test that adding a service works as expected
  it("should add a service correctly", () => {
    const service = new MockService();
    rxService.addService("mockService", service);
    const retrievedService = rxService.getService("mockService");
    expect(retrievedService).toBe(service);
  });

  // Test that a warning is logged when attempting to add a service with an existing key
  it("should warn when adding a service with a duplicate key", () => {
    const consoleWarnSpy = jest
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    const service1 = new MockService();
    const service2 = new MockService();

    rxService.addService("mockService", service1);
    rxService.addService("mockService", service2);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Service with key "mockService" already exists. Overwriting.'
    );
    consoleWarnSpy.mockRestore();
  });

  // Test that getting a non-existing service returns undefined
  it("should return undefined for non-existing services", () => {
    expect(rxService.getService("nonExistentService")).toBeUndefined();
  });

  // Test that checking if a service exists works correctly
  it("should correctly check if a service exists", () => {
    const service = new MockService();
    rxService.addService("mockService", service);
    expect(rxService.hasService("mockService")).toBe(true);
    expect(rxService.hasService("nonExistentService")).toBe(false);
  });

  // Test that resetting the service clears all services
  it("should reset all services", () => {
    const service1 = new MockService();
    const service2 = new MockService();
    rxService.addService("service1", service1);
    rxService.addService("service2", service2);
    rxService.reset();
    expect(rxService.getServices()).toEqual({});
  });
});
