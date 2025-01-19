import { ReaService } from "../src/ReaService";
import { rxService } from "../src/RxService";

jest.mock("../src/RxService", () => ({
  rxService: {
    hasService: jest.fn(),
    addService: jest.fn(),
  },
}));

class TestService extends ReaService<number> {
  constructor(key: string) {
    super(key);
  }
}

describe("ReaService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // This test checks that a service is registered correctly in rxService
  it("should register the service with the correct key", () => {
    const mockHasService = rxService.hasService as jest.Mock;
    const mockAddService = rxService.addService as jest.Mock;

    mockHasService.mockReturnValue(false);

    const service = new TestService("testKey");

    expect(mockHasService).toHaveBeenCalledWith("testKey");
    expect(mockAddService).toHaveBeenCalledWith("testKey", service);
  });

  // This test checks that a warning is logged when a service with the same key already exists
  it("should log a warning if a service with the same key exists", () => {
    const mockHasService = rxService.hasService as jest.Mock;
    const mockAddService = rxService.addService as jest.Mock;
    const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

    mockHasService.mockReturnValue(true);

    const service = new TestService("duplicateKey");

    expect(mockHasService).toHaveBeenCalledWith("duplicateKey");
    expect(mockAddService).toHaveBeenCalledWith("duplicateKey", service);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Service with key "duplicateKey" already exists. Overwriting.'
    );

    consoleWarnSpy.mockRestore();
  });

  // This test checks that multiple services with different keys can be registered without conflicts
  it("should register multiple services with different keys", () => {
    const mockHasService = rxService.hasService as jest.Mock;
    const mockAddService = rxService.addService as jest.Mock;

    mockHasService.mockReturnValue(false);

    const service1 = new TestService("key1");
    const service2 = new TestService("key2");

    expect(mockHasService).toHaveBeenCalledWith("key1");
    expect(mockAddService).toHaveBeenCalledWith("key1", service1);
    expect(mockHasService).toHaveBeenCalledWith("key2");
    expect(mockAddService).toHaveBeenCalledWith("key2", service2);
  });

  // This test ensures that the rxService methods are correctly invoked
  it("should interact correctly with rxService methods", () => {
    const mockHasService = rxService.hasService as jest.Mock;
    const mockAddService = rxService.addService as jest.Mock;

    mockHasService.mockReturnValue(false);

    const service = new TestService("interactionTest");

    expect(mockHasService).toHaveBeenCalledTimes(1);
    expect(mockAddService).toHaveBeenCalledTimes(1);
    expect(mockAddService).toHaveBeenCalledWith("interactionTest", service);
  });
});
