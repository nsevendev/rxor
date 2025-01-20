import { rxService } from "../src/RxService";

jest.mock("../src/RxService", () => ({
  rxService: {
    getService: jest.fn(),
  },
}));

describe("rxService", () => {
  // Test when the service is found
  it("should return the service when it exists", () => {
    const mockService = { name: "MockService" };

    (rxService.getService as jest.Mock).mockReturnValue(mockService);

    const result = rxService.getService("validKey");

    expect(result).toBe(mockService);

    expect(rxService.getService).toHaveBeenCalledWith("validKey");
  });

  // Test when the service is not found
  it("should throw an error when the service is not found", () => {
    (rxService.getService as jest.Mock).mockReturnValue(undefined);

    (rxService.getService as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Service with key "invalidKey" not found.');
    });

    expect(() => rxService.getService("invalidKey")).toThrowError(
      'Service with key "invalidKey" not found.'
    );

    expect(rxService.getService).toHaveBeenCalledWith("invalidKey");
  });
});
