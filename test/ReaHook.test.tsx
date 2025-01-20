import React from "react";
import { render, act } from "@testing-library/react";
import { of } from "rxjs";
import { useRea, useReaCompute, useRxStore, useRxFetch } from "../src/ReaHook";
import { ReaXar } from "../src/ReaXar";
import { ReaXor } from "../src/ReaXor";
import { rxStore } from "../src/RxStore";
import { rxservice } from "../src/GetService";

jest.mock("../src/GetService", () => ({
  rxservice: jest.fn(),
}));

describe("ReaHook Tests", () => {
  describe("useRea", () => {
    // Test to verify that useRea subscribes to a ReaXar and reflects its value
    it("should subscribe to a ReaXar and reflect its value", () => {
      const reaxar = new ReaXar<number>(10);

      const TestComponent: React.FC = () => {
        const value = useRea(reaxar);
        return <div data-testid="value">{value}</div>;
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId("value").textContent).toBe("10");

      act(() => {
        reaxar.value = 20;
      });

      expect(getByTestId("value").textContent).toBe("20");
    });
  });

  describe("useReaCompute", () => {
    // Test to verify that useReaCompute correctly computes and reflects the value from an observable
    it("should compute and reflect the value from an observable", () => {
      const observable = of(42);

      const TestComponent: React.FC = () => {
        const value = useReaCompute(observable);
        return <div data-testid="value">{value}</div>;
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId("value").textContent).toBe("42");
    });
  });

  describe("useRxStore", () => {
    beforeEach(() => {
      rxStore.reset();
    });

    // Test to check if useRxStore returns the value of an existing ReaXor in the store
    it("should return the value of an existing ReaXor in the store", () => {
      const reaxor = ReaXor.create(100, "testStore");

      const TestComponent: React.FC = () => {
        const value = useRxStore<number>("testStore");
        return <div data-testid="value">{value}</div>;
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId("value").textContent).toBe("100");

      act(() => {
        reaxor.value = 200;
      });

      expect(getByTestId("value").textContent).toBe("200");
    });

    // Test to ensure that useRxStore returns undefined if the store key does not exist
    it("should return undefined if the store key does not exist", () => {
      const spyWarn = jest.spyOn(console, "warn").mockImplementation(() => {});

      const TestComponent: React.FC = () => {
        const value = useRxStore<number>("invalidKey");
        return <div data-testid="value">{value ?? "undefined"}</div>;
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId("value").textContent).toBe("undefined");

      expect(spyWarn).toHaveBeenCalled();

      spyWarn.mockRestore();
    });
  });

  describe("useRxFetch", () => {
    // Test to check that useRxFetch handles the loading and success states correctly
    it("should handle loading and success states", async () => {
      const mockService = {
        fetchData: jest.fn().mockResolvedValue({ data: "mocked data" }),
      };

      (rxservice as jest.Mock).mockReturnValue(mockService);

      const mockMethod = jest.fn(async () => Promise.resolve());

      const TestComponent: React.FC = () => {
        const { loading, error } = useRxFetch("testService", mockMethod);
        if (loading) return <div data-testid="state">Loading...</div>;
        if (error) return <div data-testid="state">Error</div>;
        return <div data-testid="state">Success</div>;
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId("state").textContent).toBe("Loading...");

      await act(async () => {
        await mockMethod();
      });

      expect(getByTestId("state").textContent).toBe("Success");
    });

    // Test to verify that useRxFetch handles errors correctly when the service fails
    it("should handle errors correctly", async () => {
      const mockService = {
        fetchData: jest.fn().mockRejectedValue(new Error("Test error")),
      };

      (rxservice as jest.Mock).mockReturnValue(mockService);

      const mockMethod = jest.fn(async () => {
        throw new Error("Test error");
      });

      const TestComponent: React.FC = () => {
        const { loading, error } = useRxFetch("testService", mockMethod);
        if (loading) return <div data-testid="state">Loading...</div>;
        if (error) return <div data-testid="state">Error: {error.message}</div>;
        return <div data-testid="state">Success</div>;
      };

      const { getByTestId } = render(<TestComponent />);
      expect(getByTestId("state").textContent).toBe("Loading...");

      await act(async () => {
        try {
          await mockMethod();
        } catch {}
      });

      expect(getByTestId("state").textContent).toBe("Error: Test error");
    });
  });
});
